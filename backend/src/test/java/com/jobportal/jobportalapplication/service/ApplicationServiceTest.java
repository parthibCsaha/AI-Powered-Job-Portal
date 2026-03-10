package com.jobportal.jobportalapplication.service;

import com.jobportal.jobportalapplication.dto.ApplicationRequest;
import com.jobportal.jobportalapplication.dto.ApplicationResponse;
import com.jobportal.jobportalapplication.entity.*;
import com.jobportal.jobportalapplication.exception.BadRequestException;
import com.jobportal.jobportalapplication.exception.ResourceNotFoundException;
import com.jobportal.jobportalapplication.repo.ApplicationRepository;
import com.jobportal.jobportalapplication.repo.CandidateRepository;
import com.jobportal.jobportalapplication.repo.JobRepository;
import com.jobportal.jobportalapplication.security.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock private ApplicationRepository applicationRepository;
    @Mock private CandidateRepository candidateRepository;
    @Mock private JobRepository jobRepository;
    @Mock private EmailService emailService;
    @Mock private NotificationService notificationService;

    @InjectMocks private ApplicationService applicationService;

    private User candidateUser;
    private User employerUser;
    private Candidate candidate;
    private Employer employer;
    private Company company;
    private Job job;
    private Application application;
    private ApplicationRequest applicationRequest;
    private Authentication candidateAuth;
    private Authentication employerAuth;

    @BeforeEach
    void setUp() {
        // Candidate user
        candidateUser = new User();
        candidateUser.setId(1L);
        candidateUser.setEmail("candidate@test.com");
        candidateUser.setPassword("encoded");
        candidateUser.setRole(Role.CANDIDATE);

        // Employer user
        employerUser = new User();
        employerUser.setId(2L);
        employerUser.setEmail("employer@test.com");
        employerUser.setPassword("encoded");
        employerUser.setRole(Role.EMPLOYER);

        // Company
        company = new Company();
        company.setId(1L);
        company.setName("TechCorp");

        // Candidate
        candidate = new Candidate();
        candidate.setId(1L);
        candidate.setUser(candidateUser);
        candidate.setFullName("John Doe");
        candidate.setPhone("1234567890");

        // Employer
        employer = new Employer();
        employer.setId(1L);
        employer.setUser(employerUser);
        employer.setCompany(company);
        employer.setFullName("Jane Smith");

        // Job
        job = new Job();
        job.setId(1L);
        job.setTitle("Software Engineer");
        job.setDescription("Build software");
        job.setCompany(company);
        job.setEmployer(employer);
        job.setStatus(JobStatus.OPEN);

        // Application
        application = new Application();
        application.setId(1L);
        application.setJob(job);
        application.setCandidate(candidate);
        application.setCoverLetter("I am a great fit");
        application.setStatus(ApplicationStatus.PENDING);
        application.setAppliedDate(LocalDateTime.now());

        // Application request
        applicationRequest = new ApplicationRequest();
        applicationRequest.setJobId(1L);
        applicationRequest.setCoverLetter("I am a great fit");
        applicationRequest.setResumeText("My resume content");

        // Authentications
        UserDetailsImpl candidateDetails = new UserDetailsImpl(
                1L, "candidate@test.com", "encoded",
                List.of(new SimpleGrantedAuthority("ROLE_CANDIDATE")));
        candidateAuth = new UsernamePasswordAuthenticationToken(
                candidateDetails, null, candidateDetails.getAuthorities());

        UserDetailsImpl employerDetails = new UserDetailsImpl(
                2L, "employer@test.com", "encoded",
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYER")));
        employerAuth = new UsernamePasswordAuthenticationToken(
                employerDetails, null, employerDetails.getAuthorities());
    }

    @Test
    @DisplayName("Apply for job successfully")
    void testApplyForJob_Success() {
        when(candidateRepository.findByUserId(1L)).thenReturn(Optional.of(candidate));
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(applicationRepository.existsByJobIdAndCandidateId(1L, 1L)).thenReturn(false);
        when(applicationRepository.save(any(Application.class))).thenReturn(application);

        ApplicationResponse result = applicationService.applyForJob(applicationRequest, candidateAuth);

        assertThat(result).isNotNull();
        assertThat(result.getJobTitle()).isEqualTo("Software Engineer");
        assertThat(result.getCandidateName()).isEqualTo("John Doe");
        assertThat(result.getStatus()).isEqualTo(ApplicationStatus.PENDING);

        verify(applicationRepository).save(any(Application.class));
        verify(emailService).sendApplicationConfirmation(any(Application.class));
        verify(emailService).sendNewApplicationAlert(any(Application.class));
        verify(notificationService).notifyNewApplication(eq(2L), any(Application.class));
    }

    @Test
    @DisplayName("Apply for job fails when already applied")
    void testApplyForJob_AlreadyApplied() {
        when(candidateRepository.findByUserId(1L)).thenReturn(Optional.of(candidate));
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(applicationRepository.existsByJobIdAndCandidateId(1L, 1L)).thenReturn(true);

        assertThatThrownBy(() -> applicationService.applyForJob(applicationRequest, candidateAuth))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("You have already applied for this job");

        verify(applicationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Apply for job fails when candidate profile not found")
    void testApplyForJob_CandidateNotFound() {
        when(candidateRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> applicationService.applyForJob(applicationRequest, candidateAuth))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Candidate profile not found");
    }

    @Test
    @DisplayName("Apply for job fails when job not found")
    void testApplyForJob_JobNotFound() {
        when(candidateRepository.findByUserId(1L)).thenReturn(Optional.of(candidate));
        when(jobRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> applicationService.applyForJob(applicationRequest, candidateAuth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Job not found");
    }

    @Test
    @DisplayName("Get candidate applications")
    void testGetCandidateApplications() {
        PageRequest pageable = PageRequest.of(0, 10);
        Page<Application> appPage = new PageImpl<>(List.of(application), pageable, 1);

        when(candidateRepository.findByUserId(1L)).thenReturn(Optional.of(candidate));
        when(applicationRepository.findByCandidateId(1L, pageable)).thenReturn(appPage);

        Page<ApplicationResponse> result = applicationService.getCandidateApplications(candidateAuth, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getJobTitle()).isEqualTo("Software Engineer");
    }

    @Test
    @DisplayName("Get job applications as employer")
    void testGetJobApplications_Success() {
        PageRequest pageable = PageRequest.of(0, 10);
        Page<Application> appPage = new PageImpl<>(List.of(application), pageable, 1);

        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(applicationRepository.findByJobId(1L, pageable)).thenReturn(appPage);

        Page<ApplicationResponse> result = applicationService.getJobApplications(1L, employerAuth, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("Get job applications fails when not the employer")
    void testGetJobApplications_Unauthorized() {
        PageRequest pageable = PageRequest.of(0, 10);

        // Using candidate auth instead of employer auth
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));

        assertThatThrownBy(() -> applicationService.getJobApplications(1L, candidateAuth, pageable))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("You don't have access to these applications");
    }

    @Test
    @DisplayName("Get application by ID as candidate")
    void testGetApplicationById_AsCandidate() {
        when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));

        ApplicationResponse result = applicationService.getApplicationById(1L, candidateAuth);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getJobTitle()).isEqualTo("Software Engineer");
    }

    @Test
    @DisplayName("Get application by ID as employer")
    void testGetApplicationById_AsEmployer() {
        when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));

        ApplicationResponse result = applicationService.getApplicationById(1L, employerAuth);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Get application by ID fails for unauthorized user")
    void testGetApplicationById_Unauthorized() {
        UserDetailsImpl otherUser = new UserDetailsImpl(
                99L, "other@test.com", "encoded",
                List.of(new SimpleGrantedAuthority("ROLE_CANDIDATE")));
        Authentication otherAuth = new UsernamePasswordAuthenticationToken(
                otherUser, null, otherUser.getAuthorities());

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> applicationService.getApplicationById(1L, otherAuth))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("You don't have access to this application");
    }

    @Test
    @DisplayName("Update application status successfully")
    void testUpdateApplicationStatus_Success() {
        Application updatedApp = new Application();
        updatedApp.setId(1L);
        updatedApp.setJob(job);
        updatedApp.setCandidate(candidate);
        updatedApp.setCoverLetter("I am a great fit");
        updatedApp.setStatus(ApplicationStatus.SHORTLISTED);
        updatedApp.setAppliedDate(LocalDateTime.now());

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
        when(applicationRepository.save(any(Application.class))).thenReturn(updatedApp);

        ApplicationResponse result = applicationService.updateApplicationStatus(
                1L, ApplicationStatus.SHORTLISTED, employerAuth);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(ApplicationStatus.SHORTLISTED);

        verify(emailService).sendApplicationStatusUpdate(any(Application.class));
        verify(notificationService).notifyApplicationStatusUpdate(eq(1L), any(Application.class));
    }

    @Test
    @DisplayName("Update application status fails for non-owner employer")
    void testUpdateApplicationStatus_Unauthorized() {
        UserDetailsImpl otherEmployer = new UserDetailsImpl(
                99L, "other@test.com", "encoded",
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYER")));
        Authentication otherAuth = new UsernamePasswordAuthenticationToken(
                otherEmployer, null, otherEmployer.getAuthorities());

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> applicationService.updateApplicationStatus(
                1L, ApplicationStatus.SHORTLISTED, otherAuth))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("You don't have permission to update this application");
    }
}
