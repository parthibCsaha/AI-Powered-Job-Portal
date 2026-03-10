import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import applicationService from '../services/applicationService';
import jobService from '../services/jobService';
import { getRankedCandidates } from '../services/aiService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const Applicants = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('standard'); // 'standard' or 'ai-ranked'

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    try {
      const [jobResponse, appsResponse] = await Promise.all([
        jobService.getJobById(jobId),
        applicationService.getJobApplications(jobId, 0, 100),
      ]);
      setJob(jobResponse.data);
      setApplications(appsResponse.data.content);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIRanking = async () => {
    setAiLoading(true);
    try {
      const ranked = await getRankedCandidates(jobId);
      setRankedCandidates(ranked);
      setViewMode('ai-ranked');
    } catch (error) {
      console.error('Error fetching AI rankings:', error);
      alert('Failed to get AI rankings. Try again later.');
    } finally {
      setAiLoading(false);
    }
  };


  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await applicationService.updateApplicationStatus(applicationId, newStatus);
      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      // Also update ranked candidates if in AI view
      setRankedCandidates(rankedCandidates.map(c =>
        c.applicationId === applicationId ? { ...c, applicationStatus: newStatus } : c
      ));
    } catch {
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      REVIEWED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      SHORTLISTED: 'bg-green-500/10 text-green-400 border-green-500/20',
      REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
      ACCEPTED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (score >= 60) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const filteredApplications = filter === 'ALL'
    ? applications
    : applications.filter(app => app.status === filter);

  const filteredRankedCandidates = filter === 'ALL'
    ? rankedCandidates
    : rankedCandidates.filter(c => c.applicationStatus === filter);

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

      <div className="container mx-auto max-w-6xl">
        <button
          onClick={() => navigate('/my-jobs')}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to My Jobs
        </button>

        {job && (
          <div className="glass-card rounded-2xl p-8 border border-white/10 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{job.title}</h1>
                <p className="text-gray-400 text-lg">{job.company?.name}</p>
                <p className="text-xl font-bold text-blue-400 mt-4 flex items-center gap-2">
                  <span className="bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                    {applications.length} Total Applications
                  </span>
                </p>
              </div>

              {/* AI Ranking Section */}
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <button
                  onClick={handleAIRanking}
                  disabled={aiLoading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25 font-semibold"
                >
                  {aiLoading ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  AI Rank Candidates
                </button>
                <button
                  onClick={() => setViewMode('standard')}
                  className={`px-6 py-3 rounded-xl border transition-all font-medium ${viewMode === 'standard'
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-transparent text-gray-400 border-white/10 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  Standard View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {['ALL', 'PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'ACCEPTED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${filter === status
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
            >
              {status.replace('_', ' ')} ({
                viewMode === 'ai-ranked'
                  ? rankedCandidates.filter(c => status === 'ALL' || c.applicationStatus === status).length
                  : applications.filter(a => status === 'ALL' || a.status === status).length
              })
            </button>
          ))}
        </div>

        {/* AI Ranked View */}
        {viewMode === 'ai-ranked' && rankedCandidates.length > 0 && (
          <div className="mb-6 bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-purple-300 font-medium">AI-Ranked View: Candidates sorted by match score</span>
          </div>
        )}

        {/* Applications/Candidates List */}
        {viewMode === 'ai-ranked' && filteredRankedCandidates.length > 0 ? (
          <div className="space-y-4">
            {filteredRankedCandidates.map((candidate, index) => (
              <div
                key={candidate.applicationId}
                className="glass-card rounded-2xl p-6 border-l-4 hover:border-blue-500/30 transition-all"
                style={{
                  borderLeftColor: candidate.matchScore >= 70 ? '#10B981' : candidate.matchScore >= 50 ? '#3B82F6' : '#F59E0B',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-start gap-6">
                    {/* Rank Badge */}
                    <div className="flex flex-col items-center min-w-[80px]">
                      <span className="text-sm font-medium text-gray-400 mb-1">Rank</span>
                      <span className="text-3xl font-bold text-white">#{index + 1}</span>
                      <div className={`mt-2 px-3 py-1 rounded-full text-sm font-bold border ${getMatchScoreColor(candidate.matchScore)}`}>
                        {candidate.matchScore}%
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{candidate.candidateName}</h3>
                      <p className="text-gray-400 mb-2">{candidate.candidateEmail}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        {candidate.candidatePhone && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {candidate.candidatePhone}
                          </span>
                        )}
                        {candidate.candidateLocation && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {candidate.candidateLocation}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Applied: {new Date(candidate.appliedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(candidate.applicationStatus)}`}>
                    {candidate.applicationStatus}
                  </span>
                </div>

                {/* AI Analysis Section */}
                <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-white/5">
                  <h4 className="font-bold text-purple-300 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    AI Analysis
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Matching Skills */}
                    {candidate.matchingSkills?.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-green-400 block mb-2">✓ Matching Skills</span>
                        <div className="flex flex-wrap gap-2">
                          {candidate.matchingSkills.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-medium">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {candidate.missingSkills?.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-red-400 block mb-2">✗ Missing Skills</span>
                        <div className="flex flex-wrap gap-2">
                          {candidate.missingSkills.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Strengths */}
                  {candidate.strengthsSummary && (
                    <div className="mt-6">
                      <span className="text-sm font-medium text-blue-400 block mb-2">💪 Strengths</span>
                      <p className="text-gray-300 text-sm leading-relaxed">{candidate.strengthsSummary}</p>
                    </div>
                  )}

                  {/* Recommendation */}
                  {candidate.recommendation && (
                    <div className="mt-6 pt-4 border-t border-white/5">
                      <span className="text-sm font-medium text-purple-400 block mb-2">📋 AI Recommendation</span>
                      <p className="text-gray-300 text-sm leading-relaxed">{candidate.recommendation}</p>
                    </div>
                  )}
                </div>

                {candidate.coverLetter && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-300 mb-2">Cover Letter</h4>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                      <p className="text-gray-400 whitespace-pre-line text-sm">{candidate.coverLetter}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap pt-4 border-t border-white/5">
                  <button
                    onClick={() => handleStatusUpdate(candidate.applicationId, 'REVIEWED')}
                    className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-medium"
                  >
                    Mark as Reviewed
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(candidate.applicationId, 'SHORTLISTED')}
                    className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors text-sm font-medium"
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(candidate.applicationId, 'ACCEPTED')}
                    className="px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors text-sm font-medium"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(candidate.applicationId, 'REJECTED')}
                    className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'standard' || rankedCandidates.length === 0 ? (
          /* Standard View */
          filteredApplications.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-white/10">
              <p className="text-gray-400 text-lg">No applications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="glass-card rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{app.candidateName}</h3>
                      <p className="text-gray-400">{app.candidateEmail}</p>
                      <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Applied: {new Date(app.appliedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>

                  {app.coverLetter && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-300 mb-2">Cover Letter</h4>
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                        <p className="text-gray-400 whitespace-pre-line text-sm">{app.coverLetter}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 flex-wrap pt-4 border-t border-white/5">
                    <button
                      onClick={() => handleStatusUpdate(app.id, 'REVIEWED')}
                      className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-medium"
                    >
                      Mark as Reviewed
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(app.id, 'SHORTLISTED')}
                      className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors text-sm font-medium"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(app.id, 'ACCEPTED')}
                      className="px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors text-sm font-medium"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                      className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

export default Applicants;

