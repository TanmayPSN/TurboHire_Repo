package com.company.turbohireclone.backend.repository;

import com.company.turbohireclone.backend.entity.CandidateJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateJobRepository extends JpaRepository<CandidateJob, Long> {

    List<CandidateJob> findByCandidate_Id(Long candidateId);

    List<CandidateJob> findByJob_Id(Long jobId);

    List<CandidateJob> findByCurrentStageAndStatus(String currentStage, String status);

    List<CandidateJob> findByStatus(String status);

    long countByStatus(String status);

    @Query("""
SELECT COUNT(c)
FROM CandidateJob c
WHERE c.status = 'IN_PROGRESS'
AND NOT EXISTS (
    SELECT i FROM Interview i WHERE i.candidateJob = c
)
""")
    long countShortlisted();

    @Query("""
        SELECT to_char(c.offerAcceptedAt, 'YYYY-MM'), COUNT(c)
        FROM CandidateJob c
        WHERE c.offerAcceptedAt IS NOT NULL
        GROUP BY to_char(c.offerAcceptedAt, 'YYYY-MM')
        ORDER BY to_char(c.offerAcceptedAt, 'YYYY-MM')
    """)
    List<Object[]> hiresPerMonth();

    @Query("""
        SELECT to_char(c.appliedAt, 'YYYY-MM'), COUNT(c)
        FROM CandidateJob c
        GROUP BY to_char(c.appliedAt, 'YYYY-MM')
        ORDER BY to_char(c.appliedAt, 'YYYY-MM')
    """)
    List<Object[]> candidatesPerMonth();

    @Query("""
SELECT c.currentStage, COUNT(c)
FROM CandidateJob c
WHERE c.status != 'REJECTED'
GROUP BY c.currentStage
""")
    List<Object[]> countByCurrentStage();


}