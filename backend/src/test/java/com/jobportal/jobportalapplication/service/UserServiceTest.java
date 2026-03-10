package com.jobportal.jobportalapplication.service;

import com.jobportal.jobportalapplication.dto.ProfileUpdateRequest;
import com.jobportal.jobportalapplication.dto.UserResponse;
import com.jobportal.jobportalapplication.entity.*;
import com.jobportal.jobportalapplication.exception.ResourceNotFoundException;
import com.jobportal.jobportalapplication.repo.*;
import com.jobportal.jobportalapplication.security.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CandidateRepository candidateRepository;
    @Mock private EmployerRepository employerRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private UserService userService;

    private User candidateUser;
    private User employerUser;
    private Candidate candidate;
    private Employer employer;
    private Company company;
    private Authentication candidateAuth;
    private Authentication employerAuth;

    @BeforeEach
    void setUp() {
        // Candidate user
        candidateUser = new User();
        candidateUser.setId(1L);
        candidateUser.setEmail("candidate@test.com");
        candidateUser.setPassword("encodedPassword");
        candidateUser.setRole(Role.CANDIDATE);
        candidateUser.setIsActive(true);

        candidate = new Candidate();
        candidate.setId(1L);
        candidate.setUser(candidateUser);
        candidate.setFullName("John Doe");
        candidate.setPhone("1234567890");
        candidate.setLocation("New York");
        candidate.setSkills("Java, Spring Boot");
        candidate.setExperience("5 years in software development");
        candidate.setEducation("BS Computer Science");

        candidateUser.setCandidate(candidate);

        // Employer user
        company = new Company();
        company.setId(1L);
        company.setName("TechCorp");

        employerUser = new User();
        employerUser.setId(2L);
        employerUser.setEmail("employer@test.com");
        employerUser.setPassword("encodedPassword");
        employerUser.setRole(Role.EMPLOYER);
        employerUser.setIsActive(true);

        employer = new Employer();
        employer.setId(1L);
        employer.setUser(employerUser);
        employer.setCompany(company);
        employer.setFullName("Jane Smith");
        employer.setPosition("HR Manager");
        employer.setPhone("0987654321");

        employerUser.setEmployer(employer);

        // Authentications
        UserDetailsImpl candidateDetails = new UserDetailsImpl(
                1L, "candidate@test.com", "encodedPassword",
                List.of(new SimpleGrantedAuthority("ROLE_CANDIDATE")));
        candidateAuth = new UsernamePasswordAuthenticationToken(
                candidateDetails, null, candidateDetails.getAuthorities());

        UserDetailsImpl employerDetails = new UserDetailsImpl(
                2L, "employer@test.com", "encodedPassword",
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYER")));
        employerAuth = new UsernamePasswordAuthenticationToken(
                employerDetails, null, employerDetails.getAuthorities());
    }

    @Test
    @DisplayName("Get current user profile as candidate")
    void testGetCurrentUserProfile_Candidate() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(candidateUser));

        UserResponse result = userService.getCurrentUserProfile(candidateAuth);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("candidate@test.com");
        assertThat(result.getRole()).isEqualTo(Role.CANDIDATE);
        assertThat(result.getFullName()).isEqualTo("John Doe");
        assertThat(result.getSkills()).isEqualTo("Java, Spring Boot");
        assertThat(result.getLocation()).isEqualTo("New York");
    }

    @Test
    @DisplayName("Get current user profile as employer")
    void testGetCurrentUserProfile_Employer() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(employerUser));

        UserResponse result = userService.getCurrentUserProfile(employerAuth);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(2L);
        assertThat(result.getEmail()).isEqualTo("employer@test.com");
        assertThat(result.getRole()).isEqualTo(Role.EMPLOYER);
        assertThat(result.getPosition()).isEqualTo("HR Manager");
        assertThat(result.getCompanyName()).isEqualTo("TechCorp");
    }

    @Test
    @DisplayName("Get current user profile throws ResourceNotFoundException")
    void testGetCurrentUserProfile_NotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getCurrentUserProfile(candidateAuth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }

    @Test
    @DisplayName("Update candidate profile successfully")
    void testUpdateProfile_Candidate() {
        ProfileUpdateRequest request = new ProfileUpdateRequest();
        request.setFullName("John Updated");
        request.setPhone("9999999999");
        request.setLocation("San Francisco");
        request.setSkills("Java, Spring Boot, React");
        request.setExperience("6 years");
        request.setEducation("MS Computer Science");

        when(userRepository.findById(1L)).thenReturn(Optional.of(candidateUser));
        when(candidateRepository.findByUserId(1L)).thenReturn(Optional.of(candidate));
        when(candidateRepository.save(any(Candidate.class))).thenReturn(candidate);

        UserResponse result = userService.updateProfile(request, candidateAuth);

        assertThat(result).isNotNull();
        assertThat(result.getRole()).isEqualTo(Role.CANDIDATE);

        verify(candidateRepository).save(any(Candidate.class));
    }

    @Test
    @DisplayName("Update employer profile successfully")
    void testUpdateProfile_Employer() {
        ProfileUpdateRequest request = new ProfileUpdateRequest();
        request.setPhone("5555555555");
        request.setPosition("Director of HR");

        when(userRepository.findById(2L)).thenReturn(Optional.of(employerUser));
        when(employerRepository.findByUserId(2L)).thenReturn(Optional.of(employer));
        when(employerRepository.save(any(Employer.class))).thenReturn(employer);

        UserResponse result = userService.updateProfile(request, employerAuth);

        assertThat(result).isNotNull();
        assertThat(result.getRole()).isEqualTo(Role.EMPLOYER);

        verify(employerRepository).save(any(Employer.class));
    }

    @Test
    @DisplayName("Change password successfully")
    void testChangePassword_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(candidateUser));
        when(passwordEncoder.matches("oldPassword", "encodedPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPassword")).thenReturn("newEncodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(candidateUser);

        userService.changePassword("oldPassword", "newPassword", candidateAuth);

        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Change password fails with wrong current password")
    void testChangePassword_WrongCurrent() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(candidateUser));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword("wrongPassword", "newPassword", candidateAuth))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Current password is incorrect");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Update profile fails when user not found")
    void testUpdateProfile_UserNotFound() {
        ProfileUpdateRequest request = new ProfileUpdateRequest();
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateProfile(request, candidateAuth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }
}
