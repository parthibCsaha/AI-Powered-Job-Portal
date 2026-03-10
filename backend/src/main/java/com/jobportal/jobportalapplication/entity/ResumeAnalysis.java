package com.jobportal.jobportalapplication.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "resume_analyses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class ResumeAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @Column(length = 5000)
    private String resumeText;

    @Column(length = 2000)
    private String extractedSkills;

    @Column(length = 3000)
    private String experienceSummary;

    @Column(length = 2000)
    private String educationSummary;

    @Column(length = 1000)
    private String suggestedJobTitles;

    @Column(length = 3000)
    private String overallSummary;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime analyzedAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}

