import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import applicationService from '../services/applicationService';

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    shortlisted: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await applicationService.getMyApplications(0, 5);
      const apps = response.data.content;
      setApplications(apps);

      // Calculate stats
      const statusCounts = apps.reduce((acc, app) => {
        acc[app.status.toLowerCase()] = (acc[app.status.toLowerCase()] || 0) + 1;
        return acc;
      }, {});

      setStats({
        total: apps.length,
        pending: statusCounts.pending || 0,
        shortlisted: statusCounts.shortlisted || 0,
        rejected: statusCounts.rejected || 0,
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
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
          Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{user?.user?.fullName || 'Candidate'}</span>
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Applications</h3>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
            <h3 className="text-gray-400 text-sm font-medium mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
            <h3 className="text-gray-400 text-sm font-medium mb-2">Shortlisted</h3>
            <p className="text-3xl font-bold text-green-400">{stats.shortlisted}</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
            <h3 className="text-gray-400 text-sm font-medium mb-2">Rejected</h3>
            <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <button
            onClick={() => navigate('/jobs')}
            className="group relative p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all overflow-hidden text-left"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-1">Browse Jobs</h3>
              <p className="text-blue-100 text-sm opacity-90">Find your next opportunity</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/my-applications')}
            className="group relative p-6 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all overflow-hidden text-left"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-1">My Applications</h3>
              <p className="text-green-100 text-sm opacity-90">Track your status</p>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-1">Update Profile</h3>
              <p className="text-purple-100 text-sm opacity-90">Keep your info current</p>
            </div>
          </button>
        </div>

        {/* Recent Applications */}
        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Applications</h2>
            <button
              onClick={() => navigate('/my-applications')}
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
            >
              View All →
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-xl">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-400 mb-4">No applications yet</p>
              <button
                onClick={() => navigate('/jobs')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Start Applying
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-slate-800/50 border border-white/5 rounded-xl p-4 hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                        {app.jobTitle}
                      </h3>
                      <p className="text-gray-400">{app.companyName}</p>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Applied: {new Date(app.appliedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
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

export default CandidateDashboard;
