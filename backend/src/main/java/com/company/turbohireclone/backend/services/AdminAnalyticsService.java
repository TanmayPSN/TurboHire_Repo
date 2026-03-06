package com.company.turbohireclone.backend.services;

import com.company.turbohireclone.backend.dto.admin.*;
import com.company.turbohireclone.backend.entity.CandidateJob;

import java.util.List;

public interface AdminAnalyticsService {

    AdminDashboardResponse getFullDashboard(Long jobId);

    HiringFunnelDTO getHiringFunnel(List<CandidateJob> candidates);

    InterviewMetricsDTO getInterviewMetrics();

    TimeAnalyticsDTO getTimeAnalytics();
}