import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import jobService from '../services/jobService';
import applicationService from '../services/applicationService';
import fileService from '../services/fileService';
import { analyzeResume } from '../services/aiService';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isCandidate } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Application form state
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');

  // Process state
  const [step, setStep] = useState(1); // 1: Upload, 2: AI Analysis, 3: Review & Submit
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  // AI Analysis results
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    fetchJobDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const response = await jobService.getJobById(id);
      setJob(response.data);
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setResumeFile(file);
    setError('');
    setResumeText(''); // Will be extracted automatically on upload
  };

  const handleUploadAndAnalyze = async () => {
    if (!resumeFile) {
      setError('Please upload your resume (PDF, DOC, DOCX, or TXT)');
      return;
    }

    setUploading(true);
    setError('');
    setAiAnalysis(null);
    setStep(1);

    try {
      // Upload file and extract text automatically
      const uploadResult = await fileService.uploadResumeWithExtraction(resumeFile);
      const extractedText = uploadResult.extractedText;
      setResumeText(extractedText);

      if (!extractedText || extractedText.trim().length < 50) {
        setError('Could not extract enough text from the resume. Please try a different file.');
        setUploading(false);
        return;
      }

      // Automatically trigger AI resume analysis after extraction
      setStep(2); // Show loading UI for analysis
      try {
        const aiResult = await analyzeResume(extractedText);
        setAiAnalysis(aiResult);
        if (aiResult && !aiResult.error && aiResult.skills && aiResult.skills.length > 0) {
          setStep(3); // Move to review & submit only if analysis is valid
        } else {
          setError(aiResult?.overallSummary || 'AI resume analysis failed. Please try again later.');
        }
      } catch {
        setError('AI resume analysis failed. Please try again later.');
      }
    } catch {
      setError('Resume upload or extraction failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };


  const handleSubmitApplication = async () => {
    setApplying(true);
    setError('');

    try {
      await applicationService.applyForJob({
        jobId: parseInt(id),
        coverLetter,
        resumeText: resumeText || undefined,
        aiMatchScore: aiAnalysis?.matchScore || undefined
      });

      alert('🎉 Application submitted successfully!');
      setShowApplyModal(false);
      resetModal();
      navigate('/my-applications');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setCoverLetter('');
    setResumeFile(null);
    setResumeText('');
    setAiAnalysis(null);
    setError('');
  };

  const openApplyModal = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    resetModal();
    setShowApplyModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">
          Job not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="container mx-auto max-w-5xl">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Jobs
        </button>

        <div className="glass-card rounded-2xl p-8 border border-white/10">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 border-b border-white/10 pb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{job.title}</h1>
              <div className="flex items-center gap-3 text-lg text-gray-400">
                <span className="font-medium text-blue-400">{job.company?.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                <span>{job.location}</span>
              </div>
            </div>
            {isCandidate && (
              <button
                onClick={openApplyModal}
                className="btn-primary px-8 py-3 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
              >
                Apply Now
              </button>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="text-gray-400 text-sm mb-1">Job Type</div>
              <div className="text-white font-medium flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {job.jobType?.replace('_', ' ')}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="text-gray-400 text-sm mb-1">Experience</div>
              <div className="text-white font-medium flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {job.experienceLevel}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="text-gray-400 text-sm mb-1">Salary</div>
              <div className="text-white font-medium flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {job.salaryRange || 'Not specified'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="text-gray-400 text-sm mb-1">Posted</div>
              <div className="text-white font-medium flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(job.postedDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Job Description</h2>
                <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                  {job.description}
                </div>
              </div>

              {/* Requirements */}
              {job.requirements && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Requirements</h2>
                  <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                    {job.requirements}
                  </div>
                </div>
              )}
            </div>

            {/* Company Info Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 rounded-xl p-6 border border-white/5 sticky top-24">
                <h3 className="text-xl font-bold text-white mb-4">About the Company</h3>
                <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                  {job.company?.description || 'No description available.'}
                </p>
                {job.company?.website && (
                  <a
                    href={job.company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 px-4 bg-white/5 hover:bg-white/10 text-center rounded-lg text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
                  >
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-white/10 px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">Apply for {job.title}</h2>
                <p className="text-gray-400 text-sm">{job.company?.name}</p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-6 border-b border-white/5 bg-slate-800/30">
              <div className="flex items-center justify-center gap-4">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-400' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-700'}`}>1</div>
                  <span className="font-medium hidden sm:inline">Upload</span>
                </div>
                <div className={`w-12 h-1 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-700'}`}>2</div>
                  <span className="font-medium hidden sm:inline">Analysis</span>
                </div>
                <div className={`w-12 h-1 rounded-full ${step >= 3 ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-400' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-700'}`}>3</div>
                  <span className="font-medium hidden sm:inline">Submit</span>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                  {error}
                </div>
              )}

              {/* Step 1: Upload Resume */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">
                      Upload Your Resume
                    </label>
                    <p className="text-gray-400 text-sm mb-4">
                      Upload your resume and our AI will automatically analyze it against this job's requirements.
                    </p>
                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                      ${resumeFile ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 hover:border-blue-500/50 hover:bg-slate-800/50'}`}>
                      <input
                        type="file"
                        id="resumeUpload"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="resumeUpload" className="cursor-pointer block">
                        {resumeFile ? (
                          <>
                            <svg className="w-12 h-12 mx-auto text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-green-400 font-medium text-lg">{resumeFile.name}</p>
                            <p className="text-gray-400 text-sm mt-1">Click to change file</p>
                          </>
                        ) : (
                          <>
                            <svg className="w-12 h-12 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-gray-300 font-medium">Click to upload your resume</p>
                            <p className="text-gray-500 text-sm mt-1">PDF, DOC, DOCX, TXT (Max 5MB)</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* AI Feature Info */}
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-purple-300">AI-Powered Analysis</p>
                        <p className="text-purple-200/80 text-sm mt-1">
                          Our AI will analyze your resume against this job's requirements and show you:
                        </p>
                        <ul className="text-purple-200/80 text-sm mt-2 space-y-1">
                          <li>✓ Match score (0-100%)</li>
                          <li>✓ Skills that match the job</li>
                          <li>✓ Skills you should develop</li>
                          <li>✓ Personalized recommendations</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <button
                      onClick={() => setShowApplyModal(false)}
                      className="px-6 py-2.5 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadAndAnalyze}
                      disabled={uploading || !resumeFile}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25"
                    >
                      {uploading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>Next: AI Analysis →</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: AI Analysis */}
              {step === 2 && (
                <div className="text-center py-16">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Analyzing Your Resume...</h3>
                  <p className="text-gray-400">Our AI is comparing your profile with the job requirements</p>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* AI Resume Analysis Results */}
                  {aiAnalysis && !aiAnalysis.error && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        AI Analysis Results
                      </h3>

                      {/* Skills */}
                      {aiAnalysis.skills && aiAnalysis.skills.length > 0 && (
                        <div className="mb-4">
                          <p className="font-medium text-green-400 mb-2 text-sm uppercase tracking-wide">Matched Skills</p>
                          <div className="flex flex-wrap gap-2">
                            {aiAnalysis.skills.map((skill, idx) => (
                              <span key={idx} className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-sm">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience Summary */}
                      {aiAnalysis.experienceSummary && (
                        <div className="mb-4">
                          <p className="font-medium text-blue-400 mb-2 text-sm uppercase tracking-wide">Experience Summary</p>
                          <p className="text-gray-300 text-sm leading-relaxed">{aiAnalysis.experienceSummary}</p>
                        </div>
                      )}

                      {/* Education Summary */}
                      {aiAnalysis.educationSummary && (
                        <div className="mb-4">
                          <p className="font-medium text-purple-400 mb-2 text-sm uppercase tracking-wide">Education</p>
                          <p className="text-gray-300 text-sm leading-relaxed">{aiAnalysis.educationSummary}</p>
                        </div>
                      )}

                      {/* Suggested Job Titles */}
                      {aiAnalysis.suggestedJobTitles && aiAnalysis.suggestedJobTitles.length > 0 && (
                        <div className="mb-4">
                          <p className="font-medium text-orange-400 mb-2 text-sm uppercase tracking-wide">Suggested Roles</p>
                          <div className="flex flex-wrap gap-2">
                            {aiAnalysis.suggestedJobTitles.map((title, idx) => (
                              <span key={idx} className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-sm">
                                {title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Overall Summary */}
                      {aiAnalysis.overallSummary && (
                        <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-white/5">
                          <p className="font-medium text-gray-200 mb-2 text-sm">Overall Assessment</p>
                          <p className="text-gray-400 text-sm leading-relaxed">{aiAnalysis.overallSummary}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error or No Analysis */}
                  {aiAnalysis && aiAnalysis.error && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-yellow-200/80 text-sm">
                          {aiAnalysis.error || 'AI analysis not available. You can still submit your application.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cover Letter */}
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">
                      Cover Letter <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      required
                      rows="6"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      placeholder="Tell us why you're a great fit for this position..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between gap-4 pt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-2.5 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      ← Back
                    </button>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowApplyModal(false)}
                        className="px-6 py-2.5 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitApplication}
                        disabled={applying || !coverLetter.trim()}
                        className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-green-500/25"
                      >
                        {applying ? (
                          <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          <>🚀 Submit Application</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;

