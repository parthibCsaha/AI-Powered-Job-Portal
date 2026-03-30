package com.jobportal.jobportalapplication.service;

import com.jobportal.jobportalapplication.dto.JobRequest;
import com.jobportal.jobportalapplication.dto.JobResponse;
import com.jobportal.jobportalapplication.entity.Employer;
import com.jobportal.jobportalapplication.entity.Job;
import com.jobportal.jobportalapplication.entity.JobStatus;
import com.jobportal.jobportalapplication.entity.JobType;
import com.jobportal.jobportalapplication.exception.BadRequestException;
import com.jobportal.jobportalapplication.exception.ResourceNotFoundException;
import com.jobportal.jobportalapplication.exception.UnauthorizedException;
import com.jobportal.jobportalapplication.repo.ApplicationRepository;
import com.jobportal.jobportalapplication.repo.CompanyRepository;
import com.jobportal.jobportalapplication.repo.EmployerRepository;
import com.jobportal.jobportalapplication.repo.JobRepository;
import com.jobportal.jobportalapplication.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Cacheable(value = "jobs", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort")
    public Page<JobResponse> getAllJobs(Pageable pageable) {
        return jobRepository.findAll(pageable).map(this::mapToResponse);
    }

    public Page<JobResponse> searchJobs(String keyword, String location,
                                        JobType jobType, String experienceLevel,
                                        Long companyId, Pageable pageable) {

        Specification<Job> spec = Specification.allOf();

        if (keyword != null && !keyword.isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("title")), "%" + keyword.toLowerCase() + "%"),
                            cb.like(cb.lower(root.get("description")), "%" + keyword.toLowerCase() + "%")
                    )
            );
        }

        if (location != null && !location.isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase() + "%")
            );
        }

        if (jobType != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("jobType"), jobType)
            );
        }

        if (experienceLevel != null && !experienceLevel.isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("experienceLevel"), experienceLevel)
            );
        }

        if (companyId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("company").get("id"), companyId)
            );
        }

        // Only show OPEN jobs for public search
        spec = spec.and((root, query, cb) ->
                cb.equal(root.get("status"), JobStatus.OPEN)
        );

        return jobRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Cacheable(value = "jobDetail", key = "#id")
    public JobResponse getJobById(Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        return mapToResponse(job);
    }

    @Transactional
    @CacheEvict(value = "jobs", allEntries = true)
    public JobResponse createJob(JobRequest request, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Employer employer = employerRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new BadRequestException("Employer profile not found"));

        Job job = new Job();
        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setRequirements(request.getRequirements());
        job.setLocation(request.getLocation());
        job.setJobType(request.getJobType());
        job.setSalaryRange(request.getSalaryRange());
        job.setExperienceLevel(request.getExperienceLevel());
        job.setStatus(request.getStatus() != null ? request.getStatus() : JobStatus.OPEN);
        job.setClosingDate(request.getClosingDate());

        job.setCompany(companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found")));
        job.setEmployer(employer);

        job = jobRepository.save(job);

        return mapToResponse(job);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "jobs", allEntries = true),
            @CacheEvict(value = "jobDetail", key = "#id")
    })
    public JobResponse updateJob(Long id, JobRequest request, Authentication authentication) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        // Check if user is the job owner
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        if (!job.getEmployer().getUser().getId().equals(userDetails.getId())) {
            throw new UnauthorizedException("You don't have permission to update this job");
        }

        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setRequirements(request.getRequirements());
        job.setLocation(request.getLocation());
        job.setJobType(request.getJobType());
        job.setSalaryRange(request.getSalaryRange());
        job.setExperienceLevel(request.getExperienceLevel());

        if (request.getStatus() != null) {
            job.setStatus(request.getStatus());
        }

        job.setClosingDate(request.getClosingDate());

        job = jobRepository.save(job);

        return mapToResponse(job);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "jobs", allEntries = true),
            @CacheEvict(value = "jobDetail", key = "#id")
    })
    public void deleteJob(Long id, Authentication authentication) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        if (!job.getEmployer().getUser().getId().equals(userDetails.getId())) {
            throw new UnauthorizedException("You don't have permission to delete this job");
        }

        jobRepository.delete(job);
    }

    public Page<JobResponse> getEmployerJobs(Authentication authentication, Pageable pageable) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Employer employer = employerRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new BadRequestException("Employer profile not found"));

        return jobRepository.findByEmployerId(employer.getId(), pageable)
                .map(this::mapToResponse);
    }

    private JobResponse mapToResponse(Job job) {
        JobResponse response = new JobResponse();
        response.setId(job.getId());
        response.setTitle(job.getTitle());
        response.setDescription(job.getDescription());
        response.setRequirements(job.getRequirements());
        response.setLocation(job.getLocation());
        response.setJobType(job.getJobType());
        response.setSalaryRange(job.getSalaryRange());
        response.setExperienceLevel(job.getExperienceLevel());
        response.setStatus(job.getStatus());
        response.setPostedDate(job.getPostedDate());
        response.setClosingDate(job.getClosingDate());
        response.setCreatedAt(job.getCreatedAt());
        response.setEmployerId(job.getEmployer().getId());

        if (job.getCompany() != null) {
            response.setCompany(CompanyService.mapToResponse(job.getCompany()));
        }

        response.setApplicationsCount(
                applicationRepository.countByJobId(job.getId()).intValue()
        );

        return response;
    }
}

