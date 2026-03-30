package com.jobportal.jobportalapplication.dto;

import com.jobportal.jobportalapplication.entity.JobStatus;
import com.jobportal.jobportalapplication.entity.JobType;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class JobResponse implements Serializable {
    private Long id;
    private String title;
    private String description;
    private String requirements;
    private String location;
    private JobType jobType;
    private String salaryRange;
    private String experienceLevel;
    private JobStatus status;
    private LocalDate postedDate;
    private LocalDate closingDate;
    private LocalDateTime createdAt;
    private CompanyResponse company;
    private Long employerId;
    private Integer applicationsCount;
}