package com.jobportal.jobportalapplication.service;

import com.jobportal.jobportalapplication.dto.JobRequest;
import com.jobportal.jobportalapplication.dto.JobResponse;
import com.jobportal.jobportalapplication.entity.*;
import com.jobportal.jobportalapplication.exception.BadRequestException;
import com.jobportal.jobportalapplication.exception.ResourceNotFoundException;
import com.jobportal.jobportalapplication.exception.UnauthorizedException;
import com.jobportal.jobportalapplication.repo.ApplicationRepository;
import com.jobportal.jobportalapplication.repo.CompanyRepository;
import com.jobportal.jobportalapplication.repo.EmployerRepository;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock private JobRepository jobRepository;
    @Mock private EmployerRepository employerRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private ApplicationRepository applicationRepository;

    @InjectMocks private JobService jobService;

    private User employerUser;
    private Employer employer;
    private Company company;
    private Job job;
    private JobRequest jobRequest;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        // Setup user
        employerUser = new User();
        employerUser.setId(1L);
        employerUser.setEmail("employer@test.com");
        employerUser.setPassword("encoded");
        employerUser.setRole(Role.EMPLOYER);
        employerUser.setIsActive(true);

        // Setup company
        company = new Company();
        company.setId(1L);
        company.setName("TechCorp");
        company.setDescription("A tech company");
        company.setIndustry("Technology");
        company.setLocation("San Francisco");

        // Setup employer
        employer = new Employer();
        employer.setId(1L);
        employer.setUser(employerUser);
        employer.setCompany(company);
        employer.setFullName("Jane Smith");
        employer.setPosition("HR Manager");

        employerUser.setEmployer(employer);

        // Setup job
        job = new Job();
        job.setId(1L);
        job.setTitle("Software Engineer");
        job.setDescription("Build great software");
        job.setRequirements("Java, Spring Boot");
        job.setLocation("San Francisco");
        job.setJobType(JobType.FULL_TIME);
        job.setSalaryRange("100k-150k");
        job.setExperienceLevel("Mid-Level");
        job.setStatus(JobStatus.OPEN);
        job.setPostedDate(LocalDate.now());
        job.setCompany(company);
        job.setEmployer(employer);

        // Setup job request
        jobRequest = new JobRequest();
        jobRequest.setTitle("Software Engineer");
        jobRequest.setDescription("Build great software");
        jobRequest.setRequirements("Java, Spring Boot");
        jobRequest.setLocation("San Francisco");
        jobRequest.setJobType(JobType.FULL_TIME);
        jobRequest.setSalaryRange("100k-150k");
        jobRequest.setExperienceLevel("Mid-Level");
        jobRequest.setCompanyId(1L);

        // Setup authentication
        UserDetailsImpl userDetails = new UserDetailsImpl(
                1L, "employer@test.com", "encoded",
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYER")));
        authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
    }

    @Test
    @DisplayName("Get all jobs returns paginated results")
    void testGetAllJobs() {
        PageRequest pageable = PageRequest.of(0, 10);
        Page<Job> jobPage = new PageImpl<>(List.of(job), pageable, 1);

        when(jobRepository.findAll(pageable)).thenReturn(jobPage);
        when(applicationRepository.countByJobId(1L)).thenReturn(5L);

        Page<JobResponse> result = jobService.getAllJobs(pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Software Engineer");
        assertThat(result.getContent().get(0).getApplicationsCount()).isEqualTo(5);
    }

    @Test
    @DisplayName("Get job by ID successfully")
    void testGetJobById_Success() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(applicationRepository.countByJobId(1L)).thenReturn(3L);

        JobResponse result = jobService.getJobById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Software Engineer");
        assertThat(result.getJobType()).isEqualTo(JobType.FULL_TIME);
        assertThat(result.getStatus()).isEqualTo(JobStatus.OPEN);
        assertThat(result.getCompany().getName()).isEqualTo("TechCorp");
        assertThat(result.getApplicationsCount()).isEqualTo(3);
    }

    @Test
    @DisplayName("Get job by ID throws ResourceNotFoundException")
    void testGetJobById_NotFound() {
        when(jobRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> jobService.getJobById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Job not found");
    }

    @Test
    @DisplayName("Create job successfully")
    void testCreateJob_Success() {
        when(employerRepository.findByUserId(1L)).thenReturn(Optional.of(employer));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(jobRepository.save(any(Job.class))).thenReturn(job);
        when(applicationRepository.countByJobId(anyLong())).thenReturn(0L);

        JobResponse result = jobService.createJob(jobRequest, authentication);

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Software Engineer");
        assertThat(result.getLocation()).isEqualTo("San Francisco");

        verify(jobRepository).save(any(Job.class));
    }

    @Test
    @DisplayName("Create job fails when employer profile not found")
    void testCreateJob_EmployerNotFound() {
        when(employerRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> jobService.createJob(jobRequest, authentication))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Employer profile not found");
    }

    @Test
    @DisplayName("Update job successfully")
    void testUpdateJob_Success() {
        JobRequest updateRequest = new JobRequest();
        updateRequest.setTitle("Senior Software Engineer");
        updateRequest.setDescription("Build amazing software");
        updateRequest.setRequirements("Java, Spring Boot, 5+ years");
        updateRequest.setLocation("New York");
        updateRequest.setJobType(JobType.FULL_TIME);
        updateRequest.setSalaryRange("150k-200k");
        updateRequest.setExperienceLevel("Senior");
        updateRequest.setCompanyId(1L);

        Job updatedJob = new Job();
        updatedJob.setId(1L);
        updatedJob.setTitle("Senior Software Engineer");
        updatedJob.setDescription("Build amazing software");
        updatedJob.setRequirements("Java, Spring Boot, 5+ years");
        updatedJob.setLocation("New York");
        updatedJob.setJobType(JobType.FULL_TIME);
        updatedJob.setSalaryRange("150k-200k");
        updatedJob.setExperienceLevel("Senior");
        updatedJob.setStatus(JobStatus.OPEN);
        updatedJob.setCompany(company);
        updatedJob.setEmployer(employer);

        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(jobRepository.save(any(Job.class))).thenReturn(updatedJob);
        when(applicationRepository.countByJobId(1L)).thenReturn(0L);

        JobResponse result = jobService.updateJob(1L, updateRequest, authentication);

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Senior Software Engineer");
        assertThat(result.getSalaryRange()).isEqualTo("150k-200k");
    }

    @Test
    @DisplayName("Update job throws UnauthorizedException when not owner")
    void testUpdateJob_Unauthorized() {
        // Different user
        UserDetailsImpl otherUser = new UserDetailsImpl(
                99L, "other@test.com", "encoded",
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYER")));
        Authentication otherAuth = new UsernamePasswordAuthenticationToken(
                otherUser, null, otherUser.getAuthorities());

        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));

        assertThatThrownBy(() -> jobService.updateJob(1L, jobRequest, otherAuth))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("You don't have permission to update this job");
    }

    @Test
    @DisplayName("Delete job successfully")
    void testDeleteJob_Success() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        doNothing().when(jobRepository).delete(job);

        jobService.deleteJob(1L, authentication);

        verify(jobRepository).delete(job);
    }

    @Test
    @DisplayName("Delete job throws UnauthorizedException when not owner")
    void testDeleteJob_Unauthorized() {
        UserDetailsImpl otherUser = new UserDetailsImpl(
                99L, "other@test.com", "encoded",
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYER")));
        Authentication otherAuth = new UsernamePasswordAuthenticationToken(
                otherUser, null, otherUser.getAuthorities());

        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));

        assertThatThrownBy(() -> jobService.deleteJob(1L, otherAuth))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("You don't have permission to delete this job");
    }

    @Test
    @DisplayName("Get employer jobs returns paginated results")
    void testGetEmployerJobs() {
        PageRequest pageable = PageRequest.of(0, 10);
        Page<Job> jobPage = new PageImpl<>(List.of(job), pageable, 1);

        when(employerRepository.findByUserId(1L)).thenReturn(Optional.of(employer));
        when(jobRepository.findByEmployerId(1L, pageable)).thenReturn(jobPage);
        when(applicationRepository.countByJobId(1L)).thenReturn(2L);

        Page<JobResponse> result = jobService.getEmployerJobs(authentication, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Software Engineer");
    }

    @Test
    @DisplayName("Get employer jobs fails when employer not found")
    void testGetEmployerJobs_EmployerNotFound() {
        PageRequest pageable = PageRequest.of(0, 10);
        when(employerRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> jobService.getEmployerJobs(authentication, pageable))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Employer profile not found");
    }
}
