import api from './api';

// ==================== 1. AI RESUME ANALYZER ====================

// Analyze resume and store results (for candidates)
export const analyzeAndStoreResume = async (candidateId, resumeText) => {
    const response = await api.post(`/ai/analyze-resume/${candidateId}`, { resumeText });
    return response.data;
};

// Get stored resume analysis
export const getResumeAnalysis = async (candidateId) => {
    const response = await api.get(`/ai/resume-analysis/${candidateId}`);
    return response.data;
};

// Simple resume analysis (without storage)
export const analyzeResume = async (resumeText) => {
    const response = await api.post('/ai/analyze-resume', { resumeText });
    return response.data;
};

// ==================== 2. AI JOB MATCHING ====================

// Calculate and store match score
export const calculateMatchScore = async (candidateId, jobId) => {
    const response = await api.post(`/ai/match-score/${candidateId}/${jobId}`);
    return response.data;
};

// Get match score (calculates if not exists)
export const getMatchScore = async (candidateId, jobId) => {
    const response = await api.get(`/ai/match-score/${candidateId}/${jobId}`);
    return response.data;
};

// Simple match score calculation (without storage)
export const calculateSimpleMatchScore = async (data) => {
    const response = await api.post('/ai/match-score', data);
    return response.data;
};

// ==================== 3. AI CANDIDATE RANKING ====================

// Get ranked candidates for a job (for employers)
export const getRankedCandidates = async (jobId) => {
    const response = await api.get(`/ai/ranked-candidates/${jobId}`);
    return response.data;
};

// Trigger AI analysis for all applicants
export const analyzeAllApplicants = async (jobId) => {
    const response = await api.post(`/ai/analyze-applicants/${jobId}`);
    return response.data;
};

// ==================== 4. AI JOB DESCRIPTION GENERATOR ====================

// Generate job description using AI (for employers)
export const generateJobDescription = async (data) => {
    const response = await api.post('/ai/generate-job-description', data);
    return response.data;
};

// ==================== 5. AI JOB MATCH ANALYSIS (FOR APPLICATION) ====================

// Analyze resume against job during application
export const analyzeJobMatch = async (resumeText, jobTitle, jobDescription, jobRequirements) => {
    const response = await api.post('/ai/analyze-job-match', {
        resumeText,
        jobTitle,
        jobDescription,
        jobRequirements
    });
    return response.data;
};

// ==================== 6. AI CHAT ====================

// AI Chat assistant
export const chatWithAI = async (message, history = []) => {
    const response = await api.post('/ai/chat', { message, history });
    return response.data;
};

export default {
    analyzeAndStoreResume,
    getResumeAnalysis,
    analyzeResume,
    calculateMatchScore,
    getMatchScore,
    calculateSimpleMatchScore,
    getRankedCandidates,
    analyzeAllApplicants,
    generateJobDescription,
    analyzeJobMatch,
    chatWithAI
};
