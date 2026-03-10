package com.jobportal.jobportalapplication.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String fullName;
    private String phone;
    private String location;
    private String skills;
    private String experience;
    private String education;
    private String position;
    private Long companyId;
}