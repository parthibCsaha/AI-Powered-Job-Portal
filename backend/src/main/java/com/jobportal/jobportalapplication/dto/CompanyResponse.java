package com.jobportal.jobportalapplication.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class CompanyResponse implements Serializable {
    private Long id;
    private String name;
    private String description;
    private String industry;
    private String location;
    private String website;
    private String logoUrl;
}