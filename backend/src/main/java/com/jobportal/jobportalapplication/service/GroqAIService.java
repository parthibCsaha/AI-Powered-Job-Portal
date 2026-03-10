package com.jobportal.jobportalapplication.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.jobportalapplication.dto.*;
import com.jobportal.jobportalapplication.entity.*;
import com.jobportal.jobportalapplication.repo.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;

import java.nio.file.*;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Groq AI Service - FREE and FAST
 */
@Service
@Slf4j
public class GroqAIService {

    @Value("${app.ai.groq.api-key:}")
    private String apiKey;

    @Value("${app.ai.groq.model:llama-3.3-70b-versatile}")
    private String model;

    private final String baseUrl = "https://api.groq.com/openai/v1";
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ResumeParserService resumeParserService;

    @Autowired
    private ResumeAnalysisRepository resumeAnalysisRepository;

    @Autowired
    private AIJobMatchRepository aiJobMatchRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    public GroqAIService() {
        this.restTemplate = new RestTemplateBuilder()
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(30))
                .build();
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isEmpty() && model != null && !model.isEmpty();
    }

    public String chat(String systemPrompt, String userMessage) {
        if (!isEnabled()) {
            throw new RuntimeException("Groq API is not configured. Get free key at https://console.groq.com");
        }
        log.info("[GroqAIService] Starting Groq API call for resume analysis");
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 2048);

            List<Map<String, String>> messages = new ArrayList<>();
            if (systemPrompt != null && !systemPrompt.isEmpty()) {
                messages.add(Map.of("role", "system", "content", systemPrompt));
            }
            messages.add(Map.of("role", "user", "content", userMessage));
            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    baseUrl + "/chat/completions",
                    entity,
                    String.class);

            log.info("[GroqAIService] Groq API response status: {}", response.getStatusCode());
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String content = root.path("choices").get(0).path("message").path("content").asText();
                log.info("[GroqAIService] Groq API call successful, content length: {}", content.length());
                return content;
            } else {
                log.error("[GroqAIService] Groq API error: {}", response.getStatusCode());
                throw new RuntimeException("Groq API error: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("[GroqAIService] Groq API error: ", e);
            throw new RuntimeException("Failed to get AI response: " + e.getMessage());
        }
    }

    // ==================== 1. AI RESUME ANALYZER ====================

    @Transactional
    public ResumeAnalysisResponse analyzeAndStoreResume(Long candidateId, String resumeText) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        AIResumeAnalysisResponse aiResponse = analyzeResume(new AIResumeAnalysisRequest(resumeText));

        ResumeAnalysis analysis = resumeAnalysisRepository.findByCandidateId(candidateId)
                .orElse(new ResumeAnalysis());

        analysis.setCandidate(candidate);
        analysis.setResumeText(resumeText);
        analysis.setExtractedSkills(String.join(",", aiResponse.getSkills()));
        analysis.setExperienceSummary(aiResponse.getExperienceSummary());
        analysis.setEducationSummary(aiResponse.getEducationSummary());
        analysis.setSuggestedJobTitles(String.join(",", aiResponse.getSuggestedJobTitles()));
        analysis.setOverallSummary(aiResponse.getOverallSummary());

        ResumeAnalysis saved = resumeAnalysisRepository.save(analysis);

        if (aiResponse.getSkills() != null && !aiResponse.getSkills().isEmpty()) {
            candidate.setSkills(String.join(", ", aiResponse.getSkills()));
        }
        if (aiResponse.getExperienceSummary() != null && !aiResponse.getExperienceSummary().isEmpty()) {
            candidate.setExperience(aiResponse.getExperienceSummary());
        }
        if (aiResponse.getEducationSummary() != null && !aiResponse.getEducationSummary().isEmpty()) {
            candidate.setEducation(aiResponse.getEducationSummary());
        }
        candidateRepository.save(candidate);

        return mapToResumeAnalysisResponse(saved);
    }

    public ResumeAnalysisResponse getResumeAnalysis(Long candidateId) {
        ResumeAnalysis analysis = resumeAnalysisRepository.findByCandidateId(candidateId)
                .orElseThrow(
                        () -> new RuntimeException("Resume analysis not found. Please analyze your resume first."));
        return mapToResumeAnalysisResponse(analysis);
    }

    public AIResumeAnalysisResponse analyzeResume(AIResumeAnalysisRequest request) {
        String systemPrompt = "You are an expert resume analyst.";
        String userPrompt = String.format("""
                Analyze this resume and extract key information:

                RESUME:
                %s

                Provide analysis in this format:
                SKILLS:
                [one skill per line]
                EXPERIENCE_SUMMARY:
                [3-4 sentence summary]
                EDUCATION_SUMMARY:
                [education background]
                SUGGESTED_JOB_TITLES:
                [5-7 job titles, one per line]
                OVERALL_SUMMARY:
                [3-4 sentence assessment]
                """, request.getResumeText());

        try {
            String response = chat(systemPrompt, userPrompt);
            return parseResumeAnalysisResponse(response);
        } catch (Exception e) {
            log.error("Resume analysis error: ", e);
            return new AIResumeAnalysisResponse(
                    new ArrayList<>(), "Analysis failed", "Analysis failed",
                    new ArrayList<>(), "AI analysis failed: " + e.getMessage());
        }
    }

    // ==================== 2. AI JOB MATCHING ====================

    @Transactional
    public AIJobMatchResponse calculateAndStoreMatchScore(Long candidateId, Long jobId) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        String candidateSkills = candidate.getSkills() != null ? candidate.getSkills() : "";
        String candidateExperience = candidate.getExperience() != null ? candidate.getExperience() : "";

        Optional<ResumeAnalysis> resumeAnalysis = resumeAnalysisRepository.findByCandidateId(candidateId);
        if (resumeAnalysis.isPresent()) {
            if (candidateSkills.isEmpty())
                candidateSkills = resumeAnalysis.get().getExtractedSkills();
            if (candidateExperience.isEmpty())
                candidateExperience = resumeAnalysis.get().getExperienceSummary();
        }

        String systemPrompt = "You are an expert recruiter.";
        String userPrompt = String.format("""
                Analyze match between candidate and job:

                CANDIDATE SKILLS: %s
                CANDIDATE EXPERIENCE: %s
                JOB TITLE: %s
                JOB DESCRIPTION: %s
                JOB REQUIREMENTS: %s

                Format:
                MATCH_SCORE: [0-100]
                MATCHING_SKILLS:
                [one per line]
                MISSING_SKILLS:
                [one per line]
                STRENGTHS_SUMMARY:
                [2-3 sentences]
                RECOMMENDATION:
                [2-3 sentences]
                """, candidateSkills, candidateExperience, job.getTitle(),
                job.getDescription(), job.getRequirements() != null ? job.getRequirements() : "Not specified");

        try {
            String response = chat(systemPrompt, userPrompt);

            int matchScore = parseMatchScoreValue(response);
            List<String> matchingSkills = extractList(response, "MATCHING_SKILLS:", "MISSING_SKILLS:");
            List<String> missingSkills = extractList(response, "MISSING_SKILLS:", "STRENGTHS_SUMMARY:");
            String strengthsSummary = extractTextSection(response, "STRENGTHS_SUMMARY:", "RECOMMENDATION:");
            String recommendation = extractTextSection(response, "RECOMMENDATION:", null);

            AIJobMatch match = aiJobMatchRepository.findByCandidateIdAndJobId(candidateId, jobId)
                    .orElse(new AIJobMatch());

            match.setCandidate(candidate);
            match.setJob(job);
            match.setMatchScore(matchScore);
            match.setMatchingSkills(String.join(",", matchingSkills));
            match.setMissingSkills(String.join(",", missingSkills));
            match.setStrengthsSummary(strengthsSummary);
            match.setRecommendation(recommendation);

            AIJobMatch saved = aiJobMatchRepository.save(match);
            return mapToAIJobMatchResponse(saved);
        } catch (Exception e) {
            log.error("Match score calculation error: ", e);
            AIJobMatchResponse fallback = new AIJobMatchResponse();
            fallback.setMatchScore(0);
            fallback.setRecommendation("AI analysis failed: " + e.getMessage());
            return fallback;
        }
    }

    public AIJobMatchResponse getMatchScore(Long candidateId, Long jobId) {
        AIJobMatch match = aiJobMatchRepository.findByCandidateIdAndJobId(candidateId, jobId).orElse(null);
        if (match == null) {
            return calculateAndStoreMatchScore(candidateId, jobId);
        }
        return mapToAIJobMatchResponse(match);
    }

    public AIMatchScoreResponse calculateMatchScore(AIMatchScoreRequest request) {
        String systemPrompt = "You are an expert recruiter.";
        String userPrompt = String.format("""
                Analyze match between candidate and job:

                CANDIDATE SKILLS: %s
                CANDIDATE EXPERIENCE: %s
                JOB DESCRIPTION: %s
                JOB REQUIREMENTS: %s

                Format:
                MATCH_SCORE: [0-100]
                MATCHING_SKILLS:
                [one per line]
                MISSING_SKILLS:
                [one per line]
                RECOMMENDATIONS:
                [2-3 sentences]
                """, request.getCandidateSkills(), request.getCandidateExperience(),
                request.getJobDescription(), request.getJobRequirements());

        try {
            String response = chat(systemPrompt, userPrompt);
            return parseMatchResponse(response);
        } catch (Exception e) {
            AIMatchScoreResponse fallback = new AIMatchScoreResponse();
            fallback.setMatchScore(0);
            fallback.setRecommendations("AI analysis failed: " + e.getMessage());
            return fallback;
        }
    }

    // ==================== 3. AI CANDIDATE RANKING ====================

    @Transactional
    public void analyzeAllApplicantsForJob(Long jobId) {
        List<Application> applications = applicationRepository.findByJobId(jobId,
                org.springframework.data.domain.Pageable.unpaged()).getContent();

        for (Application application : applications) {
            try {
                calculateAndStoreMatchScore(application.getCandidate().getId(), jobId);
            } catch (Exception e) {
                log.error("Failed to analyze candidate {}: {}", application.getCandidate().getId(), e.getMessage());
            }
        }
    }

    public List<RankedCandidateResponse> getRankedCandidatesForJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        List<Application> applications = applicationRepository.findByJobId(jobId,
                org.springframework.data.domain.Pageable.unpaged()).getContent();

        List<RankedCandidateResponse> rankedCandidates = new ArrayList<>();

        for (Application application : applications) {
            Candidate candidate = application.getCandidate();

            RankedCandidateResponse ranked = new RankedCandidateResponse();
            ranked.setApplicationId(application.getId());
            ranked.setCandidateId(candidate.getId());
            ranked.setCandidateName(candidate.getFullName());
            ranked.setCandidateEmail(candidate.getUser().getEmail());
            ranked.setCandidatePhone(candidate.getPhone());
            ranked.setCandidateLocation(candidate.getLocation());
            ranked.setCoverLetter(application.getCoverLetter());
            ranked.setApplicationStatus(application.getStatus().name());
            ranked.setAppliedDate(application.getAppliedDate());

            if (application.getAiMatchScore() != null && application.getAiMatchScore() > 0) {
                ranked.setMatchScore(application.getAiMatchScore());
                ranked.setRecommendation("Score calculated during application");
            } else {
                try {
                    String resumeText = application.getResumeText();

                    if (candidate.getSkills() != null)
                        resumeText += candidate.getSkills() + " ";
                    if (candidate.getExperience() != null)
                        resumeText += candidate.getExperience() + " ";
                    if (candidate.getEducation() != null)
                        resumeText += candidate.getEducation();

                    if (application.getCoverLetter() != null && !application.getCoverLetter().trim().isEmpty()) {
                        resumeText += " Cover Letter: " + application.getCoverLetter();
                    }

                    if (!resumeText.trim().isEmpty() && isEnabled()) {
                        AIMatchScoreResponse matchResult = analyzeResumeAgainstJob(
                                resumeText, job.getTitle(), job.getDescription(), job.getRequirements());
                        ranked.setMatchScore(matchResult.getMatchScore());
                        ranked.setMatchingSkills(matchResult.getMatchingSkills());
                        ranked.setMissingSkills(matchResult.getMissingSkills());
                        ranked.setRecommendation(matchResult.getRecommendations());
                    } else if (!isEnabled()) {
                        ranked.setMatchScore(0);
                        ranked.setRecommendation("AI service not configured");
                    } else {
                        ranked.setMatchScore(0);
                        ranked.setRecommendation("No resume uploaded.");
                    }
                } catch (Exception e) {
                    log.error("Error analyzing candidate {}: {}", candidate.getId(), e.getMessage());
                    ranked.setMatchScore(0);
                    ranked.setRecommendation("AI analysis failed: " + e.getMessage());
                }
            }

            rankedCandidates.add(ranked);
        }

        rankedCandidates.sort((a, b) -> {
            int scoreA = a.getMatchScore() != null ? a.getMatchScore() : 0;
            int scoreB = b.getMatchScore() != null ? b.getMatchScore() : 0;
            return Integer.compare(scoreB, scoreA);
        });

        return rankedCandidates;
    }

    // ==================== 4. AI JOB DESCRIPTION GENERATOR ====================

    public AIJobDescriptionResponse generateJobDescription(AIJobDescriptionRequest request) {
        String systemPrompt = "You are an HR professional who writes job descriptions.";

        String userPrompt = String.format("""
                Generate job description for:
                Title: %s, Company: %s, Skills: %s, Level: %s, Type: %s

                Format:
                DESCRIPTION:
                [2-3 paragraphs]
                REQUIREMENTS:
                - requirement1
                - requirement2
                """,
                request.getJobTitle(), request.getCompanyName(), request.getKeySkills(),
                request.getExperienceLevel(), request.getJobType());

        try {
            String response = chat(systemPrompt, userPrompt);
            return parseJobDescriptionResponse(response);
        } catch (Exception e) {
            AIJobDescriptionResponse fallback = new AIJobDescriptionResponse();
            fallback.setDescription("Failed: " + e.getMessage());
            fallback.setRequirements("");
            return fallback;
        }
    }

    // ==================== 5. AI CHAT ====================

    public AIChatResponse chat(AIChatRequest request) {
        if (!isEnabled()) {
            log.warn("[GroqAIService] AI Chat is not enabled - API key not configured");
            return new AIChatResponse(
                    "AI Chat is not configured. Please set up your Groq API key at https://console.groq.com");
        }

        log.info("[GroqAIService] Processing chat request with message length: {}",
                request.getMessage() != null ? request.getMessage().length() : 0);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 2048);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", """
                    You are a helpful AI career assistant for a job portal. You help users with:
                    - Finding suitable jobs and understanding job requirements
                    - Resume writing tips and optimization
                    - Interview preparation and common questions
                    - Career advice and professional development
                    Be friendly, professional, and provide actionable advice.
                    """));

            if (request.getHistory() != null) {
                for (AIChatRequest.ChatMessage msg : request.getHistory()) {
                    messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
                }
            }
            messages.add(Map.of("role", "user", "content", request.getMessage()));
            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    baseUrl + "/chat/completions", entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String content = root.path("choices").get(0).path("message").path("content").asText();
                log.info("[GroqAIService] Chat response successful, content length: {}", content.length());
                return new AIChatResponse(content);
            } else {
                log.error("[GroqAIService] Chat API non-success response: {} - {}",
                        response.getStatusCode(), response.getBody());
                return new AIChatResponse("AI service returned an error. Please try again later.");
            }
        } catch (Exception e) {
            log.error("[GroqAIService] Chat error: {}", e.getMessage(), e);
            return new AIChatResponse("Sorry, I'm having trouble responding: " + e.getMessage());
        }
    }

    public AIMatchScoreResponse analyzeResumeAgainstJob(String resumeText, String jobTitle,
            String jobDescription, String jobRequirements) {

        String systemPrompt = "You are an expert HR recruiter. Analyze resumes and provide match analysis.";

        String userPrompt = String.format("""
                Analyze this resume against the job and provide analysis.

                RESUME:
                %s

                JOB: %s
                DESCRIPTION: %s
                REQUIREMENTS: %s

                Respond in this EXACT format:
                MATCH_SCORE: [0-100]
                MATCHING_SKILLS:
                - skill1
                - skill2
                MISSING_SKILLS:
                - skill1
                - skill2
                RECOMMENDATIONS:
                Your recommendations here.
                """,
                resumeText != null ? resumeText.substring(0, Math.min(resumeText.length(), 3000)) : "No resume",
                jobTitle != null ? jobTitle : "Not specified",
                jobDescription != null ? jobDescription.substring(0, Math.min(jobDescription.length(), 1000)) : "",
                jobRequirements != null ? jobRequirements.substring(0, Math.min(jobRequirements.length(), 1000)) : "");

        try {
            String response = chat(systemPrompt, userPrompt);
            return parseMatchResponse(response);
        } catch (Exception e) {
            log.error("Resume analysis error: ", e);
            AIMatchScoreResponse fallback = new AIMatchScoreResponse();
            fallback.setMatchScore(0);
            fallback.setRecommendations("AI analysis failed: " + e.getMessage());
            return fallback;
        }
    }

    // ==================== HELPER METHODS ====================

    private AIMatchScoreResponse parseMatchResponse(String response) {
        AIMatchScoreResponse result = new AIMatchScoreResponse();
        try {
            int score = 50;
            if (response.contains("MATCH_SCORE:")) {
                String scoreStr = response.substring(response.indexOf("MATCH_SCORE:") + 12).split("\n")[0].trim();
                score = Integer.parseInt(scoreStr.replaceAll("[^0-9]", ""));
                score = Math.min(100, Math.max(0, score));
            }
            result.setMatchScore(score);
            result.setMatchingSkills(extractList(response, "MATCHING_SKILLS:", "MISSING_SKILLS:"));
            result.setMissingSkills(extractList(response, "MISSING_SKILLS:", "RECOMMENDATIONS:"));

            if (response.contains("RECOMMENDATIONS:")) {
                result.setRecommendations(response.substring(response.indexOf("RECOMMENDATIONS:") + 16).trim());
            }
        } catch (Exception e) {
            result.setMatchScore(50);
            result.setRecommendations("Could not parse AI response.");
        }
        return result;
    }

    private int parseMatchScoreValue(String response) {
        try {
            if (response.contains("MATCH_SCORE:")) {
                String scoreStr = response.substring(response.indexOf("MATCH_SCORE:") + 12).split("\n")[0].trim();
                int score = Integer.parseInt(scoreStr.replaceAll("[^0-9]", ""));
                return Math.min(100, Math.max(0, score));
            }
        } catch (Exception e) {
        }
        return 50;
    }

    private List<String> extractList(String response, String start, String end) {
        List<String> items = new ArrayList<>();
        try {
            int s = response.indexOf(start);
            if (s == -1)
                return items;
            s += start.length();
            int e = response.indexOf(end, s);
            if (e == -1)
                e = response.length();
            for (String line : response.substring(s, e).split("\n")) {
                line = line.trim().replaceAll("^[-•*]\\s*", "");
                if (!line.isEmpty() && line.length() > 1)
                    items.add(line);
            }
        } catch (Exception ex) {
        }
        return items;
    }

    private String extractTextSection(String response, String start, String end) {
        try {
            int s = response.indexOf(start);
            if (s == -1)
                return "";
            s += start.length();
            int e = end != null ? response.indexOf(end, s) : response.length();
            if (e == -1)
                e = response.length();
            return response.substring(s, e).trim();
        } catch (Exception e) {
            return "";
        }
    }

    private AIJobDescriptionResponse parseJobDescriptionResponse(String response) {
        AIJobDescriptionResponse result = new AIJobDescriptionResponse();
        try {
            if (response.contains("DESCRIPTION:")) {
                int s = response.indexOf("DESCRIPTION:") + 12;
                int e = response.indexOf("REQUIREMENTS:");
                if (e == -1)
                    e = response.length();
                result.setDescription(response.substring(s, e).trim());
            }
            if (response.contains("REQUIREMENTS:")) {
                result.setRequirements(response.substring(response.indexOf("REQUIREMENTS:") + 13).trim());
            }
        } catch (Exception e) {
            result.setDescription(response);
        }
        return result;
    }

    private AIResumeAnalysisResponse parseResumeAnalysisResponse(String response) {
        List<String> skills = extractList(response, "SKILLS:", "EXPERIENCE_SUMMARY:");
        String experienceSummary = extractTextSection(response, "EXPERIENCE_SUMMARY:", "EDUCATION_SUMMARY:");
        String educationSummary = extractTextSection(response, "EDUCATION_SUMMARY:", "SUGGESTED_JOB_TITLES:");
        List<String> suggestedJobTitles = extractList(response, "SUGGESTED_JOB_TITLES:", "OVERALL_SUMMARY:");
        String overallSummary = extractTextSection(response, "OVERALL_SUMMARY:", null);

        return new AIResumeAnalysisResponse(skills, experienceSummary, educationSummary, suggestedJobTitles,
                overallSummary);
    }

    private ResumeAnalysisResponse mapToResumeAnalysisResponse(ResumeAnalysis analysis) {
        return new ResumeAnalysisResponse(
                analysis.getId(),
                analysis.getCandidate().getId(),
                analysis.getResumeText(),
                parseCommaList(analysis.getExtractedSkills()),
                analysis.getExperienceSummary(),
                analysis.getEducationSummary(),
                parseCommaList(analysis.getSuggestedJobTitles()),
                analysis.getOverallSummary(),
                analysis.getAnalyzedAt());
    }

    private AIJobMatchResponse mapToAIJobMatchResponse(AIJobMatch match) {
        return new AIJobMatchResponse(
                match.getId(),
                match.getCandidate().getId(),
                match.getCandidate().getFullName(),
                match.getCandidate().getUser().getEmail(),
                match.getJob().getId(),
                match.getJob().getTitle(),
                match.getMatchScore(),
                parseCommaList(match.getMatchingSkills()),
                parseCommaList(match.getMissingSkills()),
                match.getStrengthsSummary(),
                match.getRecommendation(),
                match.getAnalyzedAt());
    }

    private List<String> parseCommaList(String commaList) {
        if (commaList == null || commaList.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(commaList.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}
