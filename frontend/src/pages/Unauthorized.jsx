import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative flex items-center justify-center">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="text-center max-w-lg mx-auto">
        <div className="glass-card p-12 rounded-3xl border border-white/10 shadow-2xl shadow-red-500/10 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 mb-4 animate-float">
            403
          </h1>

          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>

          <p className="text-gray-400 mb-8 leading-relaxed">
            Sorry, you don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
          </p>

          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 shadow-lg shadow-red-500/25 transition-all transform hover:-translate-y-1 font-semibold flex items-center justify-center gap-2 mx-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;