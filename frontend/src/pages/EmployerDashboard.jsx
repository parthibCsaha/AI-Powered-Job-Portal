import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import jobService from '../services/jobService';

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    openJobs: 0,
    totalApplications: 0,
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await jobService.getMyJobs(0, 5);
      const jobsList = response.data.content;
      setJobs(jobsList);

      setStats({
        totalJobs: jobsList.length,
        openJobs: jobsList.filter(j => j.status === 'OPEN').length,
        totalApplications: jobsList.reduce((sum, j) => sum + (j.applicationsCount || 0), 0),
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
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

      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold mb-8 text-white">
          Employer Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Jobs Posted</h3>
            <p className="text-3xl font-bold text-white">{stats.totalJobs}</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
            <h3 className="text-gray-400 text-sm font-medium mb-2">Open Positions</h3>
            <p className="text-3xl font-bold text-green-400">{stats.openJobs}</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Applications</h3>
            <p className="text-3xl font-bold text-purple-400">{stats.totalApplications}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <button
            onClick={() => navigate('/post-job')}
            className="group relative p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all overflow-hidden text-left"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-1">Post a Job</h3>
              <p className="text-blue-100 text-sm opacity-90">Create a new job listing</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/my-jobs')}
            className="group relative p-6 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all overflow-hidden text-left"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-1">Manage Jobs</h3>
              <p className="text-green-100 text-sm opacity-90">View and edit listings</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="group relative p-6 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all overflow-hidden text-left"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-1">Company Profile</h3>
              <p className="text-purple-100 text-sm opacity-90">Update company info</p>
            </div>
          </button>
        </div>

        {/* Recent Jobs */}
        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Your Recent Jobs</h2>
            <button
              onClick={() => navigate('/my-jobs')}
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
            >
              View All →
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-xl">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-400 mb-4">No jobs posted yet</p>
              <button
                onClick={() => navigate('/post-job')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Post Your First Job
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-slate-800/50 border border-white/5 rounded-xl p-4 hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-gray-400">{job.location} • {job.jobType?.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Posted: {new Date(job.postedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${job.status === 'OPEN'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                        {job.status}
                      </span>
                      <p className="text-sm text-gray-400 mt-2">
                        {job.applicationsCount || 0} Applications
                      </p>
                      <button
                        onClick={() => navigate(`/applicants/${job.id}`)}
                        className="text-blue-400 hover:text-blue-300 text-sm mt-1 transition-colors"
                      >
                        View Applicants →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
