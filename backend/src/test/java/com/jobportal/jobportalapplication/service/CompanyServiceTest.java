package com.jobportal.jobportalapplication.service;

import com.jobportal.jobportalapplication.dto.CompanyRequest;
import com.jobportal.jobportalapplication.dto.CompanyResponse;
import com.jobportal.jobportalapplication.entity.Company;
import com.jobportal.jobportalapplication.exception.ResourceNotFoundException;
import com.jobportal.jobportalapplication.repo.CompanyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private CompanyService companyService;

    private Company company;
    private CompanyRequest companyRequest;

    @BeforeEach
    void setUp() {
        company = new Company();
        company.setId(1L);
        company.setName("TechCorp");
        company.setDescription("A tech company");
        company.setIndustry("Technology");
        company.setLocation("San Francisco");
        company.setWebsite("https://techcorp.com");
        company.setLogoUrl("https://techcorp.com/logo.png");

        companyRequest = new CompanyRequest();
        companyRequest.setName("TechCorp");
        companyRequest.setDescription("A tech company");
        companyRequest.setIndustry("Technology");
        companyRequest.setLocation("San Francisco");
        companyRequest.setWebsite("https://techcorp.com");
        companyRequest.setLogoUrl("https://techcorp.com/logo.png");
    }

    @Test
    @DisplayName("Get all companies returns paginated results")
    void testGetAllCompanies() {
        PageRequest pageable = PageRequest.of(0, 10);
        Page<Company> companyPage = new PageImpl<>(List.of(company), pageable, 1);

        when(companyRepository.findAll(pageable)).thenReturn(companyPage);

        Page<CompanyResponse> result = companyService.getAllCompanies(pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("TechCorp");
    }

    @Test
    @DisplayName("Get company by ID successfully")
    void testGetCompanyById_Success() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));

        CompanyResponse result = companyService.getCompanyById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("TechCorp");
        assertThat(result.getIndustry()).isEqualTo("Technology");
        assertThat(result.getLocation()).isEqualTo("San Francisco");
    }

    @Test
    @DisplayName("Get company by ID throws ResourceNotFoundException")
    void testGetCompanyById_NotFound() {
        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyService.getCompanyById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Company not found");
    }

    @Test
    @DisplayName("Create company successfully")
    void testCreateCompany() {
        when(companyRepository.save(any(Company.class))).thenReturn(company);

        CompanyResponse result = companyService.createCompany(companyRequest);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("TechCorp");
        assertThat(result.getDescription()).isEqualTo("A tech company");

        verify(companyRepository).save(any(Company.class));
    }

    @Test
    @DisplayName("Update company successfully")
    void testUpdateCompany_Success() {
        CompanyRequest updateRequest = new CompanyRequest();
        updateRequest.setName("TechCorp Updated");
        updateRequest.setDescription("Updated description");
        updateRequest.setIndustry("FinTech");
        updateRequest.setLocation("New York");
        updateRequest.setWebsite("https://techcorp-updated.com");
        updateRequest.setLogoUrl("https://techcorp-updated.com/logo.png");

        Company updatedCompany = new Company();
        updatedCompany.setId(1L);
        updatedCompany.setName("TechCorp Updated");
        updatedCompany.setDescription("Updated description");
        updatedCompany.setIndustry("FinTech");
        updatedCompany.setLocation("New York");
        updatedCompany.setWebsite("https://techcorp-updated.com");
        updatedCompany.setLogoUrl("https://techcorp-updated.com/logo.png");

        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(companyRepository.save(any(Company.class))).thenReturn(updatedCompany);

        CompanyResponse result = companyService.updateCompany(1L, updateRequest);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("TechCorp Updated");
        assertThat(result.getIndustry()).isEqualTo("FinTech");
        assertThat(result.getLocation()).isEqualTo("New York");
    }

    @Test
    @DisplayName("Update company not found throws exception")
    void testUpdateCompany_NotFound() {
        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyService.updateCompany(99L, companyRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Company not found");
    }

    @Test
    @DisplayName("Delete company successfully")
    void testDeleteCompany() {
        doNothing().when(companyRepository).deleteById(1L);

        companyService.deleteCompany(1L);

        verify(companyRepository).deleteById(1L);
    }
}
