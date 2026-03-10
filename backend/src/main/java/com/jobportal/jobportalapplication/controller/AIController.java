package com.jobportal.jobportalapplication.controller;

import com.jobportal.jobportalapplication.dto.*;
import com.jobportal.jobportalapplication.service.GroqAIService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private GroqAIService groqAIService;

    // ==================== 1. AI RESUME ANALYZER ====================

    /**
     * Analyze resume and store results
     * Used by candidates to analyze their resume
     */
    @PostMapping("/analyze-resume/{candidateId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ResumeAnalysisResponse> analyzeAndStoreResume(
            @PathVariable Long candidateId,
            @RequestBody Map<String, String> request) {
        String resumeText = request.get("resumeText");
        if (resumeText == null || resumeText.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        ResumeAnalysisResponse response = groqAIService.analyzeAndStoreResume(candidateId, resumeText);
        return ResponseEntity.ok(response);
    }

    /**
     * Get stored resume analysis for a candidate
     */
    @GetMapping("/resume-analysis/{candidateId}")
    public ResponseEntity<ResumeAnalysisResponse> getResumeAnalysis(@PathVariable Long candidateId) {
        try {
            ResumeAnalysisResponse response = groqAIService.getResumeAnalysis(candidateId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ==================== 2. AI JOB MATCHING ====================

    /**
     * Calculate match score between candidate and job
     */
    @PostMapping("/match-score/{candidateId}/{jobId}")
    public ResponseEntity<AIJobMatchResponse> calculateMatchScore(
            @PathVariable Long candidateId,
            @PathVariable Long jobId) {
        AIJobMatchResponse response = groqAIService.calculateAndStoreMatchScore(candidateId, jobId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get existing match score (or calculate if not exists)
     */
    @GetMapping("/match-score/{candidateId}/{jobId}")
    public ResponseEntity<AIJobMatchResponse> getMatchScore(
            @PathVariable Long candidateId,
            @PathVariable Long jobId) {
        AIJobMatchResponse response = groqAIService.getMatchScore(candidateId, jobId);
        return ResponseEntity.ok(response);
    }

    // ==================== 3. AI CANDIDATE RANKING ====================

    /**
     * Get all applicants for a job ranked by AI match score
     * Used by employers to view ranked candidates
     */
    @GetMapping("/ranked-candidates/{jobId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<List<RankedCandidateResponse>> getRankedCandidates(@PathVariable Long jobId) {
        List<RankedCandidateResponse> rankedCandidates = groqAIService.getRankedCandidatesForJob(jobId);
        return ResponseEntity.ok(rankedCandidates);
    }

    /**
     * Trigger AI analysis for all applicants of a job (batch)
     */
    @PostMapping("/analyze-applicants/{jobId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse> analyzeAllApplicants(@PathVariable Long jobId) {
        groqAIService.analyzeAllApplicantsForJob(jobId);
        return ResponseEntity.ok(new ApiResponse(true, "AI analysis triggered for all applicants"));
    }

    // ==================== 4. AI JOB DESCRIPTION GENERATOR ====================

    /**
     * Generate job description using AI
     * Used by employers when posting new jobs
     */
    @PostMapping("/generate-job-description")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<AIJobDescriptionResponse> generateJobDescription(
            @Valid @RequestBody AIJobDescriptionRequest request) {
        AIJobDescriptionResponse response = groqAIService.generateJobDescription(request);
        return ResponseEntity.ok(response);
    }

    // ==================== 5. AI JOB MATCH ANALYSIS (FOR APPLICATION) ====================

    /**
     * Analyze resume against specific job during application
     * Returns match score, matching skills, missing skills, and recommendations
     */
    @PostMapping("/analyze-job-match")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<AIMatchScoreResponse> analyzeJobMatch(
            @RequestBody Map<String, String> request) {
        String resumeText = request.get("resumeText");
        String jobTitle = request.get("jobTitle");
        String jobDescription = request.get("jobDescription");
        String jobRequirements = request.get("jobRequirements");

        if (resumeText == null || resumeText.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        AIMatchScoreResponse response = groqAIService.analyzeResumeAgainstJob(
                resumeText, jobTitle, jobDescription, jobRequirements);
        return ResponseEntity.ok(response);
    }

    // ==================== 6. ORIGINAL ENDPOINTS ====================

    /**
     * Simple resume analysis (without storage)
     */
    @PostMapping("/analyze-resume")
    public ResponseEntity<AIResumeAnalysisResponse> analyzeResume(
            @Valid @RequestBody AIResumeAnalysisRequest request) {
        AIResumeAnalysisResponse response = groqAIService.analyzeResume(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Simple match score calculation (without storage)
     */
    @PostMapping("/match-score")
    public ResponseEntity<AIMatchScoreResponse> calculateMatchScore(
            @Valid @RequestBody AIMatchScoreRequest request) {
        AIMatchScoreResponse response = groqAIService.calculateMatchScore(request);
        return ResponseEntity.ok(response);
    }

    /**
     * AI Chat assistant for job portal help
     */
    @PostMapping("/chat")
    public ResponseEntity<AIChatResponse> chat(
            @Valid @RequestBody AIChatRequest request) {
        AIChatResponse response = groqAIService.chat(request);
        return ResponseEntity.ok(response);
    }
}
