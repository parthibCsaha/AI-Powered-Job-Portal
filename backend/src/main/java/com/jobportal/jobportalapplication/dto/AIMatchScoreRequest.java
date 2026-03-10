package com.jobportal.jobportalapplication.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AIMatchScoreRequest {

    @NotBlank(message = "Candidate skills are required")
    private String candidateSkills;

    @NotBlank(message = "Candidate experience is required")
    private String candidateExperience;

    @NotBlank(message = "Job requirements are required")
    private String jobRequirements;

    @NotBlank(message = "Job description is required")
    private String jobDescription;
}

