package com.jobportal.jobportalapplication.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIJobMatchResponse {
    private Long id;
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private Long jobId;
    private String jobTitle;
    private Integer matchScore;
    private List<String> matchingSkills;
    private List<String> missingSkills;
    private String strengthsSummary;
    private String recommendation;
    private LocalDateTime analyzedAt;
}

