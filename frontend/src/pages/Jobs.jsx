import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import jobService from '../services/jobService';

const Jobs = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    location: searchParams.get('location') || '',
    jobType: '',
    experienceLevel: '',
    sortBy: 'postedDate',
    sortDir: 'DESC',
  });

  useEffect(() => {
    fetchJobs();
  }, [filters, pagination.page]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.page,
        size: pagination.size,
      };
      const response = await jobService.searchJobs(params);
      setJobs(response.data.content);
      setPagination({
        ...pagination,
        totalPages: response.data.totalPages,
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters({ ...filters, [name]: value });
    setPagination({ ...pagination, page: 0 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
    window.scrollTo(0, 0);
  };

  const inputClasses = "w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all";

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Browse Jobs</h1>
            <p className="text-gray-400">Find your next opportunity from our curated listings</p>
          </div>
          <div className="text-sm text-gray-500">
            Showing {jobs.length} jobs
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-6 rounded-2xl mb-8 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search jobs..."
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              className={inputClasses}
            />

            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className={inputClasses}
            />

            <select
              value={filters.jobType}
              onChange={(e) => handleFilterChange('jobType', e.target.value)}
              className={inputClasses}
            >
              <option value="" className="bg-slate-800">All Job Types</option>
              <option value="FULL_TIME" className="bg-slate-800">Full Time</option>
              <option value="PART_TIME" className="bg-slate-800">Part Time</option>
              <option value="CONTRACT" className="bg-slate-800">Contract</option>
              <option value="INTERNSHIP" className="bg-slate-800">Internship</option>
              <option value="REMOTE" className="bg-slate-800">Remote</option>
            </select>

            <select
              value={filters.experienceLevel}
              onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
              className={inputClasses}
            >
              <option value="" className="bg-slate-800">All Levels</option>
              <option value="Entry" className="bg-slate-800">Entry Level</option>
              <option value="Mid" className="bg-slate-800">Mid Level</option>
              <option value="Senior" className="bg-slate-800">Senior Level</option>
            </select>
          </div>
        </div>

        {/* Job Listings */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center border border-white/10">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
            <p className="text-gray-400">Try adjusting your search filters to find what you're looking for.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="glass-card p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 hover:bg-slate-800/50 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                          {job.title}
                        </h3>
                        {job.jobType === 'REMOTE' && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                            Remote
                          </span>
                        )}
                      </div>

                      <p className="text-gray-400 mb-4 flex items-center gap-2">
                        <span className="font-medium text-gray-300">{job.company?.name}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-500" />
                        <span>{job.location}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="px-3 py-1 rounded-full bg-slate-800/50 border border-white/5 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {job.jobType?.replace('_', ' ')}
                        </span>
                        {job.salaryRange && (
                          <span className="px-3 py-1 rounded-full bg-slate-800/50 border border-white/5 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {job.salaryRange}
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full bg-slate-800/50 border border-white/5 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {job.experienceLevel}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-2">
                      <span className="text-xs text-gray-500">
                        Posted {new Date(job.postedDate).toLocaleDateString()}
                      </span>
                      <button className="px-4 py-2 rounded-lg bg-blue-600/10 text-blue-400 text-sm font-medium hover:bg-blue-600 hover:text-white transition-all">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 0}
                  className="px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {[...Array(pagination.totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index)}
                    className={`px-4 py-2 rounded-lg transition-all ${pagination.page === index
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-slate-800 border border-white/10 text-gray-400 hover:text-white hover:bg-slate-700'
                      }`}
                  >
                    {index + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages - 1}
                  className="px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Jobs;