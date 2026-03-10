package com.jobportal.jobportalapplication.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIResumeAnalysisResponse {
    private List<String> skills;
    private String experienceSummary;
    private String educationSummary;
    private List<String> suggestedJobTitles;
    private String overallSummary;
}

