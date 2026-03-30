package com.jobportal.jobportalapplication.service;

import com.jobportal.jobportalapplication.dto.CompanyRequest;
import com.jobportal.jobportalapplication.dto.CompanyResponse;
import com.jobportal.jobportalapplication.entity.Company;
import com.jobportal.jobportalapplication.exception.ResourceNotFoundException;
import com.jobportal.jobportalapplication.repo.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    @Cacheable(value = "companies", key = "#pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<CompanyResponse> getAllCompanies(Pageable pageable) {
        return companyRepository.findAll(pageable).map(CompanyService::mapToResponse);
    }

    @Cacheable(value = "companyDetail", key = "#id")
    public CompanyResponse getCompanyById(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        return mapToResponse(company);
    }

    @Transactional
    @CacheEvict(value = "companies", allEntries = true)
    public CompanyResponse createCompany(CompanyRequest request) {
        Company company = new Company();
        company.setName(request.getName());
        company.setDescription(request.getDescription());
        company.setIndustry(request.getIndustry());
        company.setLocation(request.getLocation());
        company.setWebsite(request.getWebsite());
        company.setLogoUrl(request.getLogoUrl());

        company = companyRepository.save(company);
        return mapToResponse(company);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "companies", allEntries = true),
            @CacheEvict(value = "companyDetail", key = "#id")
    })
    public CompanyResponse updateCompany(Long id, CompanyRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        company.setName(request.getName());
        company.setDescription(request.getDescription());
        company.setIndustry(request.getIndustry());
        company.setLocation(request.getLocation());
        company.setWebsite(request.getWebsite());
        company.setLogoUrl(request.getLogoUrl());

        company = companyRepository.save(company);
        return mapToResponse(company);
    }

    public static CompanyResponse mapToResponse(Company company) {
        CompanyResponse response = new CompanyResponse();
        response.setId(company.getId());
        response.setName(company.getName());
        response.setDescription(company.getDescription());
        response.setIndustry(company.getIndustry());
        response.setLocation(company.getLocation());
        response.setWebsite(company.getWebsite());
        response.setLogoUrl(company.getLogoUrl());
        return response;
    }

    @Caching(evict = {
            @CacheEvict(value = "companies", allEntries = true),
            @CacheEvict(value = "companyDetail", key = "#id")
    })
    public void deleteCompany(Long id) {
        companyRepository.deleteById(id);
    }
}