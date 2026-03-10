package com.jobportal.jobportalapplication.service;

import com.jobportal.jobportalapplication.dto.ApplicationRequest;
import com.jobportal.jobportalapplication.dto.ApplicationResponse;
import com.jobportal.jobportalapplication.entity.Application;
import com.jobportal.jobportalapplication.entity.ApplicationStatus;
import com.jobportal.jobportalapplication.entity.Candidate;
import com.jobportal.jobportalapplication.entity.Job;
import com.jobportal.jobportalapplication.exception.BadRequestException;
import com.jobportal.jobportalapplication.exception.ResourceNotFoundException;
import com.jobportal.jobportalapplication.repo.ApplicationRepository;
import com.jobportal.jobportalapplication.repo.CandidateRepository;
import com.jobportal.jobportalapplication.repo.JobRepository;
import com.jobportal.jobportalapplication.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public ApplicationResponse applyForJob(ApplicationRequest request,
                                           Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Candidate candidate = candidateRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new BadRequestException("Candidate profile not found"));

        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        // Check if already applied
        if (applicationRepository.existsByJobIdAndCandidateId(
                request.getJobId(), candidate.getId())) {
            throw new BadRequestException("You have already applied for this job");
        }

        Application application = new Application();
        application.setJob(job);
        application.setCandidate(candidate);
        application.setCoverLetter(request.getCoverLetter());
        application.setResumeText(request.getResumeText());
        application.setAiMatchScore(request.getAiMatchScore());
        application.setStatus(ApplicationStatus.PENDING);

        application = applicationRepository.save(application);

        // Send notifications
        emailService.sendApplicationConfirmation(application);
        emailService.sendNewApplicationAlert(application);

        notificationService.notifyNewApplication(
                job.getEmployer().getUser().getId(),
                application
        );

        return mapToResponse(application);
    }

    public Page<ApplicationResponse> getCandidateApplications(
            Authentication authentication, Pageable pageable) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Candidate candidate = candidateRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new BadRequestException("Candidate profile not found"));

        return applicationRepository.findByCandidateId(candidate.getId(), pageable)
                .map(this::mapToResponse);
    }

    public Page<ApplicationResponse> getJobApplications(Long jobId,
                                                        Authentication authentication,
                                                        Pageable pageable) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        // Verify employer owns this job
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        if (!job.getEmployer().getUser().getId().equals(userDetails.getId())) {
            throw new BadRequestException("You don't have access to these applications");
        }

        return applicationRepository.findByJobId(jobId, pageable)
                .map(this::mapToResponse);
    }

    public ApplicationResponse getApplicationById(Long id, Authentication authentication) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        // Check access permission
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();

        boolean isCandidate = application.getCandidate().getUser().getId().equals(userId);
        boolean isEmployer = application.getJob().getEmployer().getUser().getId().equals(userId);

        if (!isCandidate && !isEmployer) {
            throw new BadRequestException("You don't have access to this application");
        }

        return mapToResponse(application);
    }

    @Transactional
    public ApplicationResponse updateApplicationStatus(Long id,
                                                       ApplicationStatus status,
                                                       Authentication authentication) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        // Verify employer owns this job
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        if (!application.getJob().getEmployer().getUser().getId().equals(userDetails.getId())) {
            throw new BadRequestException("You don't have permission to update this application");
        }

        application.setStatus(status);
        application = applicationRepository.save(application);

        // Send notification to candidate
        emailService.sendApplicationStatusUpdate(application);
        notificationService.notifyApplicationStatusUpdate(
                application.getCandidate().getUser().getId(),
                application
        );

        return mapToResponse(application);
    }

    private ApplicationResponse mapToResponse(Application application) {
        ApplicationResponse response = new ApplicationResponse();
        response.setId(application.getId());
        response.setJobId(application.getJob().getId());
        response.setJobTitle(application.getJob().getTitle());
        response.setCompanyId(application.getJob().getCompany().getId());
        response.setCompanyName(application.getJob().getCompany().getName());
        response.setCandidateId(application.getCandidate().getId());
        response.setCandidateName(application.getCandidate().getFullName());
        response.setCandidateEmail(application.getCandidate().getUser().getEmail());
        response.setCoverLetter(application.getCoverLetter());
        response.setStatus(application.getStatus());
        response.setAppliedDate(application.getAppliedDate());
        response.setUpdatedAt(application.getUpdatedAt());
        return response;
    }
}