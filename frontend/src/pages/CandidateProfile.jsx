import React, { useState, useEffect } from 'react';
import userService from '../services/userService';
import fileService from '../services/fileService';
import { analyzeAndStoreResume, getResumeAnalysis } from '../services/aiService';

const CandidateProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  // AI Resume Analysis state
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [candidateId, setCandidateId] = useState(null);

  // File upload state
  const [uploading, setUploading] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    skills: '',
    experience: '',
    education: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userService.getCurrentProfile();
      setProfileData({
        fullName: response.data.fullName || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        location: response.data.location || '',
        skills: response.data.skills || '',
        experience: response.data.experience || '',
        education: response.data.education || '',
      });

      // Set candidate ID for AI features
      if (response.data.id) {
        setCandidateId(response.data.id);
        // Try to fetch existing AI analysis
        try {
          const analysisResponse = await getResumeAnalysis(response.data.id);
          setResumeAnalysis(analysisResponse);
        } catch {
          // No existing analysis, that's fine
        }
      }
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await userService.updateProfile(profileData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // AI Resume Analysis handler
  const handleAIAnalyze = async () => {
    if (!resumeText.trim()) {
      setError('Please paste your resume text first');
      return;
    }
    if (!candidateId) {
      setError('Unable to identify candidate. Please refresh the page.');
      return;
    }

    setAiAnalyzing(true);
    setError('');

    try {
      const response = await analyzeAndStoreResume(candidateId, resumeText);
      setResumeAnalysis(response);
      setSuccess('Resume analyzed successfully! Your profile has been updated with extracted information.');

      // Refresh profile data to show updated skills/experience
      fetchProfile();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('AI Analysis error:', err);
      setError('Failed to analyze resume. Make sure Ollama is running locally.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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

      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">My Profile</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'personal'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
          >
            Personal Information
          </button>
          <button
            onClick={() => setActiveTab('professional')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'professional'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
          >
            Professional Details
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('ai-analysis')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'ai-analysis'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            AI Resume Analyzer
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-6">
            {success}
          </div>
        )}

        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <div className="glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Personal Information</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-xl text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={profileData.location}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-500 disabled:bg-slate-700 disabled:text-gray-400 transition-all shadow-lg shadow-blue-500/25 font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Professional Details Tab */}
        {activeTab === 'professional' && (
          <div className="glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Professional Details</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Skills
                </label>
                <textarea
                  name="skills"
                  value={profileData.skills}
                  onChange={handleProfileChange}
                  rows="4"
                  placeholder="Java, Spring Boot, React, PostgreSQL..."
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Experience
                </label>
                <textarea
                  name="experience"
                  value={profileData.experience}
                  onChange={handleProfileChange}
                  rows="6"
                  placeholder="Describe your work experience..."
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Education
                </label>
                <textarea
                  name="education"
                  value={profileData.education}
                  onChange={handleProfileChange}
                  rows="4"
                  placeholder="Your educational background..."
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Resume
                </label>
                <div className="space-y-3">
                  {/* File Upload */}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="resumeFile"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setUploading(true);
                          setError('');
                          try {
                            // Use extraction upload
                            const result = await fileService.uploadResumeWithExtraction(file);
                            setSuccess('Resume uploaded and extracted successfully!');
                            setResumeText(result.extractedText || '');
                            // Automatically trigger AI analysis if text is extracted
                            if (result.extractedText) {
                              await handleAIAnalyze();
                            }
                            setTimeout(() => setSuccess(''), 3000);
                          } catch (err) {
                            setError('Failed to upload or extract resume');
                          } finally {
                            setUploading(false);
                          }
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="resumeFile"
                      className={`cursor-pointer w-full px-6 py-8 border-2 border-dashed border-white/10 rounded-xl hover:border-blue-500/50 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-3 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {uploading ? (
                        <>
                          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                          <span className="text-gray-400">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <span className="text-blue-400 font-medium">Click to upload</span>
                            <span className="text-gray-500"> or drag and drop</span>
                            <p className="text-sm text-gray-600 mt-1">PDF, DOC, DOCX (Max 5MB)</p>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-500 disabled:bg-slate-700 disabled:text-gray-400 transition-all shadow-lg shadow-blue-500/25 font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="glass-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength="6"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength="6"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-500 disabled:bg-slate-700 disabled:text-gray-400 transition-all shadow-lg shadow-blue-500/25 font-semibold"
                >
                  {saving ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* AI Resume Analysis Tab */}
        {activeTab === 'ai-analysis' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-2xl p-8 mb-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">AI Resume Analyzer</h2>
                  <p className="text-purple-200">Let AI extract skills, experience, and suggest matching jobs</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    Paste Your Resume Text
                  </label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows="10"
                    placeholder="Copy and paste your entire resume content here..."
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />
                </div>

                <button
                  onClick={handleAIAnalyze}
                  disabled={aiAnalyzing || !resumeText.trim()}
                  className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 disabled:bg-slate-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25 font-semibold"
                >
                  {aiAnalyzing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Analyze Resume with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Analysis Results */}
            {resumeAnalysis && (
              <div className="glass-card rounded-2xl p-8 border border-white/10 space-y-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                  <h3 className="text-xl font-bold text-white">AI Analysis Results</h3>
                  <span className="text-sm text-gray-400">
                    Analyzed: {new Date(resumeAnalysis.analyzedAt).toLocaleString()}
                  </span>
                </div>

                {/* Overall Summary */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                  <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                    <span className="text-xl">📋</span> Overall Summary
                  </h4>
                  <p className="text-gray-300 leading-relaxed">{resumeAnalysis.overallSummary}</p>
                </div>

                {/* Extracted Skills */}
                <div>
                  <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">🛠️</span> Extracted Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {resumeAnalysis.extractedSkills?.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experience Summary */}
                <div>
                  <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">💼</span> Experience Summary
                  </h4>
                  <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5">
                    <p className="text-gray-300 leading-relaxed">{resumeAnalysis.experienceSummary}</p>
                  </div>
                </div>

                {/* Education Summary */}
                <div>
                  <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">🎓</span> Education Summary
                  </h4>
                  <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5">
                    <p className="text-gray-300 leading-relaxed">{resumeAnalysis.educationSummary}</p>
                  </div>
                </div>

                {/* Suggested Job Titles */}
                <div>
                  <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">🎯</span> Suggested Job Titles
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {resumeAnalysis.suggestedJobTitles?.map((title, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 px-4 py-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateProfile;
