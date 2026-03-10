package com.jobportal.jobportalapplication.dto;

import com.jobportal.jobportalapplication.entity.ApplicationStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApplicationResponse {
    private Long id;
    private Long jobId;
    private String jobTitle;
    private Long companyId;
    private String companyName;
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private String coverLetter;
    private ApplicationStatus status;
    private LocalDateTime appliedDate;
    private LocalDateTime updatedAt;
}