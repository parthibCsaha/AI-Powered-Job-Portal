package com.jobportal.jobportalapplication.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIMatchScoreResponse {
    private int matchScore;
    private List<String> matchingSkills;
    private List<String> missingSkills;
    private String recommendations;
}

