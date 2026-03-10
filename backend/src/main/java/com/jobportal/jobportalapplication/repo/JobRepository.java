package com.jobportal.jobportalapplication.repo;

import com.jobportal.jobportalapplication.entity.Job;
import com.jobportal.jobportalapplication.entity.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {
    Page<Job> findByEmployerId(Long employerId, Pageable pageable);
    Page<Job> findByCompanyId(Long companyId, Pageable pageable);
    Long countByStatus(JobStatus status);
    Long countByPostedDateAfter(LocalDateTime date);

    @Query("SELECT j.company.name, COUNT(j) FROM Job j " +
            "GROUP BY j.company.id, j.company.name " +
            "ORDER BY COUNT(j) DESC")
    List<Object[]> findTopCompaniesByJobCount(Pageable pageable);
}