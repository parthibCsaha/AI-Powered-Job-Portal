package com.jobportal.jobportalapplication.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResumeAnalysisResponse {
    private Long id;
    private Long candidateId;
    private String resumeText;
    private List<String> extractedSkills;
    private String experienceSummary;
    private String educationSummary;
    private List<String> suggestedJobTitles;
    private String overallSummary;
    private LocalDateTime analyzedAt;
}

