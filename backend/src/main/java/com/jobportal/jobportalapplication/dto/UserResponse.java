package com.jobportal.jobportalapplication.dto;

import com.jobportal.jobportalapplication.entity.Role;
import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String email;
    private Role role;
    private Boolean isActive;
    private Long profileId;

    // Candidate fields
    private String fullName;
    private String phone;
    private String location;
    private String skills;
    private String experience;
    private String education;

    // Employer fields
    private String position;
    private Long companyId;
    private String companyName;
}