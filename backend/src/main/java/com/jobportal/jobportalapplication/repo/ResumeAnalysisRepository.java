package com.jobportal.jobportalapplication.repo;

import com.jobportal.jobportalapplication.entity.ResumeAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResumeAnalysisRepository extends JpaRepository<ResumeAnalysis, Long> {
    Optional<ResumeAnalysis> findByCandidateId(Long candidateId);
    boolean existsByCandidateId(Long candidateId);
    void deleteByCandidateId(Long candidateId);
}

