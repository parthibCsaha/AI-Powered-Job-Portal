package com.jobportal.jobportalapplication.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApplicationRequest {

    @NotNull(message = "Job ID is required")
    private Long jobId;

    @NotBlank(message = "Cover letter is required")
    private String coverLetter;

    private String resumeText;

    private Integer aiMatchScore;
}
