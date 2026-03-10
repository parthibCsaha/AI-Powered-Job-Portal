package com.jobportal.jobportalapplication.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RankedCandidateResponse {
    private Long applicationId;
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private String candidatePhone;
    private String candidateLocation;
    private String coverLetter;
    private String applicationStatus;
    private LocalDateTime appliedDate;

    // AI Analysis Fields
    private Integer matchScore;
    private List<String> matchingSkills;
    private List<String> missingSkills;
    private String strengthsSummary;
    private String recommendation;
    private LocalDateTime aiAnalyzedAt;
}
