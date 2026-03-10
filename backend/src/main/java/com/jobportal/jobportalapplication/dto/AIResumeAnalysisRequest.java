package com.jobportal.jobportalapplication.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIResumeAnalysisRequest {

    @NotBlank(message = "Resume text is required")
    private String resumeText;
}

