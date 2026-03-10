package com.jobportal.jobportalapplication.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIJobDescriptionResponse {
    private String description;
    private String requirements;
}

