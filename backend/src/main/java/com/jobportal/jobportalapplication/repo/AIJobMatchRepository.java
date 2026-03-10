package com.jobportal.jobportalapplication.repo;

import com.jobportal.jobportalapplication.entity.AIJobMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AIJobMatchRepository extends JpaRepository<AIJobMatch, Long> {

    Optional<AIJobMatch> findByCandidateIdAndJobId(Long candidateId, Long jobId);

    boolean existsByCandidateIdAndJobId(Long candidateId, Long jobId);

    List<AIJobMatch> findByCandidateIdOrderByMatchScoreDesc(Long candidateId);

    List<AIJobMatch> findByJobIdOrderByMatchScoreDesc(Long jobId);

    @Query("SELECT m FROM AIJobMatch m WHERE m.job.id = :jobId ORDER BY m.matchScore DESC")
    List<AIJobMatch> findRankedCandidatesByJobId(@Param("jobId") Long jobId);

    @Query("SELECT m FROM AIJobMatch m WHERE m.candidate.id = :candidateId AND m.matchScore >= :minScore ORDER BY m.matchScore DESC")
    List<AIJobMatch> findGoodMatchesForCandidate(@Param("candidateId") Long candidateId, @Param("minScore") Integer minScore);

    void deleteByJobId(Long jobId);

    void deleteByCandidateId(Long candidateId);
}

