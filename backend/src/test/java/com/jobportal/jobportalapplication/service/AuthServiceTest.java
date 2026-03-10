package com.jobportal.jobportalapplication.service;

import com.jobportal.jobportalapplication.dto.AuthResponse;
import com.jobportal.jobportalapplication.dto.LoginRequest;
import com.jobportal.jobportalapplication.dto.RegisterRequest;
import com.jobportal.jobportalapplication.entity.*;
import com.jobportal.jobportalapplication.exception.BadRequestException;
import com.jobportal.jobportalapplication.repo.CandidateRepository;
import com.jobportal.jobportalapplication.repo.CompanyRepository;
import com.jobportal.jobportalapplication.repo.EmployerRepository;
import com.jobportal.jobportalapplication.repo.UserRepository;
import com.jobportal.jobportalapplication.security.JwtTokenProvider;
import com.jobportal.jobportalapplication.security.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
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
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CandidateRepository candidateRepository;
    @Mock private EmployerRepository employerRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider tokenProvider;

    @InjectMocks private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User savedUser;
    private Candidate savedCandidate;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        // Setup register request
        registerRequest = new RegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setRole(Role.CANDIDATE);
        registerRequest.setFullName("John Doe");
        registerRequest.setPhone("1234567890");
        registerRequest.setLocation("New York");

        // Setup login request
        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");

        // Setup saved user
        savedUser = new User();
        savedUser.setId(1L);
        savedUser.setEmail("test@example.com");
        savedUser.setPassword("encodedPassword");
        savedUser.setRole(Role.CANDIDATE);
        savedUser.setIsActive(true);

        // Setup saved candidate
        savedCandidate = new Candidate();
        savedCandidate.setId(1L);
        savedCandidate.setUser(savedUser);
        savedCandidate.setFullName("John Doe");
        savedCandidate.setPhone("1234567890");
        savedCandidate.setLocation("New York");

        savedUser.setCandidate(savedCandidate);

        // Setup authentication
        UserDetailsImpl userDetails = new UserDetailsImpl(
                1L, "test@example.com", "encodedPassword",
                List.of(new SimpleGrantedAuthority("ROLE_CANDIDATE")));
        authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
    }

    @Test
    @DisplayName("Register candidate successfully")
    void testRegisterCandidate_Success() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(candidateRepository.save(any(Candidate.class))).thenReturn(savedCandidate);
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(tokenProvider.generateToken(any())).thenReturn("jwt-token");
        when(tokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");

        AuthResponse response = authService.register(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(response.getUser()).isNotNull();
        assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");
        assertThat(response.getUser().getRole()).isEqualTo(Role.CANDIDATE);

        verify(userRepository).save(any(User.class));
        verify(candidateRepository).save(any(Candidate.class));
        verify(employerRepository, never()).save(any(Employer.class));
    }

    @Test
    @DisplayName("Register employer successfully")
    void testRegisterEmployer_Success() {
        registerRequest.setRole(Role.EMPLOYER);
        registerRequest.setPosition("HR Manager");
        registerRequest.setCompanyId(1L);

        User employerUser = new User();
        employerUser.setId(2L);
        employerUser.setEmail("test@example.com");
        employerUser.setPassword("encodedPassword");
        employerUser.setRole(Role.EMPLOYER);
        employerUser.setIsActive(true);

        Company company = new Company();
        company.setId(1L);
        company.setName("TechCorp");

        Employer savedEmployer = new Employer();
        savedEmployer.setId(1L);
        savedEmployer.setUser(employerUser);
        savedEmployer.setFullName("John Doe");
        savedEmployer.setPosition("HR Manager");
        savedEmployer.setCompany(company);

        employerUser.setEmployer(savedEmployer);

        UserDetailsImpl userDetails = new UserDetailsImpl(
                2L, "test@example.com", "encodedPassword",
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYER")));
        Authentication empAuth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(employerUser);
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(employerRepository.save(any(Employer.class))).thenReturn(savedEmployer);
        when(authenticationManager.authenticate(any())).thenReturn(empAuth);
        when(tokenProvider.generateToken(any())).thenReturn("jwt-token");
        when(tokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");

        AuthResponse response = authService.register(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getUser().getRole()).isEqualTo(Role.EMPLOYER);

        verify(employerRepository).save(any(Employer.class));
        verify(candidateRepository, never()).save(any(Candidate.class));
    }

    @Test
    @DisplayName("Register with duplicate email throws exception")
    void testRegister_DuplicateEmail() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email already in use");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Login successfully")
    void testLogin_Success() {
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(tokenProvider.generateToken(any())).thenReturn("jwt-token");
        when(tokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");
        when(userRepository.findById(1L)).thenReturn(Optional.of(savedUser));

        AuthResponse response = authService.login(loginRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("Login with wrong credentials throws exception")
    void testLogin_WrongCredentials() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BadCredentialsException.class);
    }
}
