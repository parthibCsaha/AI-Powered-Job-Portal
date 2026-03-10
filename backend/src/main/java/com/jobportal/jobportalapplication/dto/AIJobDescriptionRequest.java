package com.jobportal.jobportalapplication.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AIJobDescriptionRequest {

    @NotBlank(message = "Job title is required")
    private String jobTitle;

    @NotBlank(message = "Company name is required")
    private String companyName;

    private String keySkills;

    private String experienceLevel;

    private String jobType;

    private String additionalInfo;
}

