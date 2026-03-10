package com.jobportal.jobportalapplication.service;

import com.jobportal.jobportalapplication.dto.ProfileUpdateRequest;
import com.jobportal.jobportalapplication.dto.UserResponse;
import com.jobportal.jobportalapplication.entity.Candidate;
import com.jobportal.jobportalapplication.entity.Employer;
import com.jobportal.jobportalapplication.entity.Role;
import com.jobportal.jobportalapplication.entity.User;
import com.jobportal.jobportalapplication.exception.ResourceNotFoundException;
import com.jobportal.jobportalapplication.repo.*;
import com.jobportal.jobportalapplication.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public UserResponse getCurrentUserProfile(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(ProfileUpdateRequest request, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.CANDIDATE) {
            Candidate candidate = candidateRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found"));

            if (request.getFullName() != null) candidate.setFullName(request.getFullName());
            if (request.getPhone() != null) candidate.setPhone(request.getPhone());
            if (request.getLocation() != null) candidate.setLocation(request.getLocation());
            if (request.getSkills() != null) candidate.setSkills(request.getSkills());
            if (request.getExperience() != null) candidate.setExperience(request.getExperience());
            if (request.getEducation() != null) candidate.setEducation(request.getEducation());

            candidateRepository.save(candidate);

        } else if (user.getRole() == Role.EMPLOYER) {
            Employer employer = employerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employer profile not found"));

            if (request.getPhone() != null) employer.setPhone(request.getPhone());
            if (request.getPosition() != null) employer.setPosition(request.getPosition());

            if (request.getCompanyId() != null) {
                employer.setCompany(companyRepository.findById(request.getCompanyId())
                        .orElseThrow(() -> new ResourceNotFoundException("Company not found")));
            }

            employerRepository.save(employer);
        }

        return mapToUserResponse(user);
    }

    @Transactional
    public void changePassword(String currentPassword, String newPassword, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private UserResponse mapToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setIsActive(user.getIsActive());

        if (user.getRole() == Role.CANDIDATE && user.getCandidate() != null) {
            Candidate candidate = user.getCandidate();
            response.setProfileId(candidate.getId());
            response.setFullName(candidate.getFullName());
            response.setPhone(candidate.getPhone());
            response.setLocation(candidate.getLocation());
            response.setSkills(candidate.getSkills());
            response.setExperience(candidate.getExperience());
            response.setEducation(candidate.getEducation());

        } else if (user.getRole() == Role.EMPLOYER && user.getEmployer() != null) {
            Employer employer = user.getEmployer();
            response.setProfileId(employer.getId());
            response.setPhone(employer.getPhone());
            response.setPosition(employer.getPosition());

            if (employer.getCompany() != null) {
                response.setCompanyId(employer.getCompany().getId());
                response.setCompanyName(employer.getCompany().getName());
            }
        }

        return response;
    }
}