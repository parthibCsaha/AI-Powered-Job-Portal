package com.jobportal.jobportalapplication.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.jobportal.jobportalapplication.dto.CompanyResponse;
import com.jobportal.jobportalapplication.dto.JobRequest;
import com.jobportal.jobportalapplication.dto.JobResponse;
import com.jobportal.jobportalapplication.entity.JobStatus;
import com.jobportal.jobportalapplication.entity.JobType;
import com.jobportal.jobportalapplication.exception.GlobalExceptionHandler;
import com.jobportal.jobportalapplication.exception.ResourceNotFoundException;
import com.jobportal.jobportalapplication.service.JobService;
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
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class JobControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private JobService jobService;

    @InjectMocks
    private JobController jobController;

    private JobResponse jobResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(jobController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        // Setup job response
        CompanyResponse companyResponse = new CompanyResponse();
        companyResponse.setId(1L);
        companyResponse.setName("TechCorp");
        companyResponse.setIndustry("Technology");

        jobResponse = new JobResponse();
        jobResponse.setId(1L);
        jobResponse.setTitle("Software Engineer");
        jobResponse.setDescription("Build great software");
        jobResponse.setRequirements("Java, Spring Boot");
        jobResponse.setLocation("San Francisco");
        jobResponse.setJobType(JobType.FULL_TIME);
        jobResponse.setSalaryRange("100k-150k");
        jobResponse.setExperienceLevel("Mid-Level");
        jobResponse.setStatus(JobStatus.OPEN);
        jobResponse.setPostedDate(LocalDate.now());
        jobResponse.setCompany(companyResponse);
        jobResponse.setEmployerId(1L);
        jobResponse.setApplicationsCount(5);
    }

    @Test
    @DisplayName("GET /api/jobs - Get all jobs")
    void testGetAllJobs() throws Exception {
        PageRequest pageable = PageRequest.of(0, 10);
        Page<JobResponse> jobPage = new PageImpl<>(List.of(jobResponse), pageable, 1);

        when(jobService.getAllJobs(any())).thenReturn(jobPage);

        mockMvc.perform(get("/api/jobs")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].title", is("Software Engineer")))
                .andExpect(jsonPath("$.data.content[0].company.name", is("TechCorp")))
                .andExpect(jsonPath("$.data.content[0].applicationsCount", is(5)));
    }

    @Test
    @DisplayName("GET /api/jobs/{id} - Get job by ID")
    void testGetJobById_Success() throws Exception {
        when(jobService.getJobById(1L)).thenReturn(jobResponse);

        mockMvc.perform(get("/api/jobs/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.title", is("Software Engineer")))
                .andExpect(jsonPath("$.data.jobType", is("FULL_TIME")))
                .andExpect(jsonPath("$.data.status", is("OPEN")));
    }

    @Test
    @DisplayName("GET /api/jobs/{id} - Job not found")
    void testGetJobById_NotFound() throws Exception {
        when(jobService.getJobById(99L))
                .thenThrow(new ResourceNotFoundException("Job not found"));

        mockMvc.perform(get("/api/jobs/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Job not found")));
    }

    @Test
    @DisplayName("GET /api/jobs/search - Search jobs with keyword")
    void testSearchJobs() throws Exception {
        PageRequest pageable = PageRequest.of(0, 10);
        Page<JobResponse> jobPage = new PageImpl<>(List.of(jobResponse), pageable, 1);

        when(jobService.searchJobs(eq("engineer"), any(), any(), any(), any(), any()))
                .thenReturn(jobPage);

        mockMvc.perform(get("/api/jobs/search")
                        .param("keyword", "engineer")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].title", is("Software Engineer")));
    }
}
