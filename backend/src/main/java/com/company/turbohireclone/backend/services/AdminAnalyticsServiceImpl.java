package com.company.turbohireclone.backend.services;

import com.company.turbohireclone.backend.dto.admin.*;
import com.company.turbohireclone.backend.entity.CandidateJob;
import com.company.turbohireclone.backend.entity.JobRound;
import com.company.turbohireclone.backend.enums.AttendanceStatus;
import com.company.turbohireclone.backend.enums.InterviewStatus;
import com.company.turbohireclone.backend.repository.CandidateJobRepository;
import com.company.turbohireclone.backend.repository.InterviewRepository;
import com.company.turbohireclone.backend.repository.JobRepository;
import com.company.turbohireclone.backend.repository.JobRoundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {

    private final JobRepository jobRepository;
    private final CandidateJobRepository candidateJobRepository;
    private final InterviewRepository interviewRepository;
    private final JobRoundRepository jobRoundRepository;

    // =====================================================
    // FULL DASHBOARD
    // =====================================================

    @Override
    public AdminDashboardResponse getFullDashboard(Long jobId) {

        List<CandidateJob> candidates;

        // 🔥 JOB FILTER SUPPORT
        if (jobId == null) {
            candidates = candidateJobRepository.findAll();
        } else {
            candidates = candidateJobRepository.findByJob_Id(jobId);
        }

        long totalActiveJobs =
                jobRepository.countByStatusNot("DELETED");

        // 🔥 USE FILTERED CANDIDATES
        long totalPipeline =
                candidates.stream()
                        .filter(c -> "IN_PROGRESS".equals(c.getStatus()))
                        .count();

        long totalHired =
                candidates.stream()
                        .filter(c -> "HIRED".equals(c.getStatus()))
                        .count();

        long totalRejected =
                candidates.stream()
                        .filter(c -> "REJECTED".equals(c.getStatus()))
                        .count();

        long totalShortlisted =
                candidates.stream()
                        .filter(c -> !"REJECTED".equals(c.getStatus()))
                        .count();

        long totalInterviews =
                interviewRepository.count();

        double overallConversionRate =
                totalShortlisted == 0
                        ? 0
                        : ((double) totalHired / totalShortlisted) * 100;

        double interviewsPerHire =
                totalHired == 0
                        ? 0
                        : (double) totalInterviews / totalHired;

        overallConversionRate = round(overallConversionRate);
        interviewsPerHire = round(interviewsPerHire);

        return AdminDashboardResponse.builder()
                .totalActiveJobs(totalActiveJobs)
                .totalPipeline(totalPipeline)
                .totalHired(totalHired)
                .totalRejected(totalRejected)

                // 🔥 PASS FILTERED CANDIDATES TO FUNNEL
                .funnel(getHiringFunnel(candidates))

                .interviewMetrics(getInterviewMetrics())
                .timeAnalytics(getTimeAnalytics())
                .r1Pending(getR1Pending())
                .totalShortlisted(totalShortlisted)
                .overallConversionRate(overallConversionRate)
                .interviewsPerHire(interviewsPerHire)
                .build();
    }

    // =====================================================
    // HIRING FUNNEL (CUMULATIVE + ANALYTICS)
    // =====================================================

    // 🔥 CHANGED METHOD SIGNATURE
    public HiringFunnelDTO getHiringFunnel(List<CandidateJob> candidates) {

        List<JobRound> allRounds =
                jobRoundRepository.findAll();

        Map<String, Integer> roundOrderMap = new HashMap<>();

        for (JobRound round : allRounds) {
            roundOrderMap.putIfAbsent(
                    round.getRoundName(),
                    round.getRoundOrder()
            );
        }

        List<Map.Entry<String, Integer>> sortedRounds =
                new ArrayList<>(roundOrderMap.entrySet());

        sortedRounds.sort(Map.Entry.comparingByValue());

        List<StageCountDTO> stages = new ArrayList<>();

        // -------------------------------------------------
        // SHORTLISTED
        // -------------------------------------------------

        long shortlisted =
                candidates.stream()
                        .filter(c -> !"REJECTED".equals(c.getStatus()))
                        .count();

        stages.add(StageCountDTO.builder()
                .stage("SHORTLISTED")
                .count(shortlisted)
                .build());

        // -------------------------------------------------
        // ROUND STAGES
        // -------------------------------------------------

        for (Map.Entry<String, Integer> entry : sortedRounds) {

            String roundName = entry.getKey();
            int order = entry.getValue();

            long count =
                    candidates.stream()
                            .filter(c -> !"REJECTED".equals(c.getStatus()))
                            .filter(c -> {

                                if ("HIRED".equals(c.getStatus()))
                                    return true;

                                String currentStage = c.getCurrentStage();

                                if (currentStage == null)
                                    return false;

                                Integer candidateOrder =
                                        roundOrderMap.get(currentStage);

                                if (candidateOrder == null)
                                    return false;

                                return candidateOrder >= order;
                            })
                            .count();

            stages.add(StageCountDTO.builder()
                    .stage(roundName)
                    .count(count)
                    .build());
        }

        // -------------------------------------------------
        // HIRED
        // -------------------------------------------------

        long hired =
                candidates.stream()
                        .filter(c -> "HIRED".equals(c.getStatus()))
                        .count();

        stages.add(StageCountDTO.builder()
                .stage("HIRED")
                .count(hired)
                .build());

        enrichFunnelAnalytics(stages);

        return HiringFunnelDTO.builder()
                .stages(stages)
                .build();
    }

    // =====================================================
    // INTERVIEW METRICS
    // =====================================================

    @Override
    public InterviewMetricsDTO getInterviewMetrics() {

        long scheduled =
                interviewRepository.countByStatus(InterviewStatus.SCHEDULED);

        long completed =
                interviewRepository.countByStatus(InterviewStatus.COMPLETED);

        long noShow =
                interviewRepository.countByAttendanceStatus(AttendanceStatus.NO_SHOW);

        long totalConducted = completed + noShow;

        double noShowRate =
                totalConducted == 0
                        ? 0
                        : ((double) noShow / totalConducted) * 100;

        return InterviewMetricsDTO.builder()
                .scheduled(scheduled)
                .completed(completed)
                .noShow(noShow)
                .noShowRate(round(noShowRate))
                .build();
    }

    // =====================================================
    // TIME ANALYTICS
    // =====================================================

    @Override
    public TimeAnalyticsDTO getTimeAnalytics() {

        List<MonthlyTrendPointDTO> interviews =
                interviewRepository.interviewsPerMonth().stream()
                        .map(r -> {
                            Integer year = (Integer) r[0];
                            Integer month = (Integer) r[1];
                            Long count = (Long) r[2];

                            String formattedMonth =
                                    year + "-" + String.format("%02d", month);

                            return new MonthlyTrendPointDTO(formattedMonth, count);
                        })
                        .toList();

        List<MonthlyTrendPointDTO> hires =
                candidateJobRepository.hiresPerMonth().stream()
                        .map(r -> new MonthlyTrendPointDTO(
                                (String) r[0],
                                (Long) r[1]))
                        .toList();

        List<MonthlyTrendPointDTO> candidates =
                candidateJobRepository.candidatesPerMonth().stream()
                        .map(r -> new MonthlyTrendPointDTO(
                                (String) r[0],
                                (Long) r[1]))
                        .toList();

        return TimeAnalyticsDTO.builder()
                .hiresPerMonth(hires)
                .candidatesPerMonth(candidates)
                .interviewsPerMonth(interviews)
                .build();
    }

    // =====================================================
    // FUNNEL ANALYTICS
    // =====================================================

    private void enrichFunnelAnalytics(List<StageCountDTO> stages) {

        for (int i = 1; i < stages.size(); i++) {

            StageCountDTO previous = stages.get(i - 1);
            StageCountDTO current = stages.get(i);

            long moved =
                    previous.getMoved() != null
                            ? previous.getMoved()
                            : 0;

            long rejected =
                    previous.getRejected() != null
                            ? previous.getRejected()
                            : 0;

            long decidedCandidates = moved + rejected;

            if (decidedCandidates == 0) {
                current.setConversionRate(0.0);
                current.setDropOffRate(0.0);
                current.setBottleneck(false);
                continue;
            }

            double conversion =
                    ((double) moved / decidedCandidates) * 100;

            double dropOff =
                    ((double) rejected / decidedCandidates) * 100;

            conversion = round(conversion);
            dropOff = round(dropOff);

            current.setConversionRate(conversion);
            current.setDropOffRate(dropOff);

            current.setBottleneck(
                    dropOff > 50 || conversion < 40
            );
        }
    }
    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private long getR1Pending() {
        return interviewRepository.countR1Pending();
    }
}