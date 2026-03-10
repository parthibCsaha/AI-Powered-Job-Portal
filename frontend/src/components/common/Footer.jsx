import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="relative bg-slate-900 pt-20 pb-10 overflow-hidden">
      {/* Background Gradient Blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"></div>

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">
                AI Powered Job Portal
              </span>
            </Link>
            <p className="text-gray-400 leading-relaxed mb-6">
              Connecting talented professionals with world-class opportunities. Your next career move starts here.
            </p>
            <div className="flex gap-4">
              {['twitter', 'github', 'linkedin'].map((social) => (
                <a
                  key={social}
                  href={`#${social}`}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all duration-300"
                >
                  <span className="sr-only">{social}</span>
                  <i className={`fab fa-${social}`}></i>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">For Candidates</h4>
            <ul className="space-y-4">
              <li><Link to="/jobs" className="text-gray-400 hover:text-blue-400 transition-colors">Browse Jobs</Link></li>
              <li><Link to="/companies" className="text-gray-400 hover:text-blue-400 transition-colors">Browse Companies</Link></li>
              <li><Link to="/dashboard" className="text-gray-400 hover:text-blue-400 transition-colors">Candidate Dashboard</Link></li>
              <li><Link to="/saved-jobs" className="text-gray-400 hover:text-blue-400 transition-colors">Saved Jobs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">For Employers</h4>
            <ul className="space-y-4">
              <li><Link to="/post-job" className="text-gray-400 hover:text-blue-400 transition-colors">Post a Job</Link></li>
              <li><Link to="/dashboard" className="text-gray-400 hover:text-blue-400 transition-colors">Employer Dashboard</Link></li>
              <li><Link to="/pricing" className="text-gray-400 hover:text-blue-400 transition-colors">Pricing Plans</Link></li>
              <li><Link to="/resources" className="text-gray-400 hover:text-blue-400 transition-colors">Recruiting Resources</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400">
                <svg className="w-6 h-6 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>support@jobportal.com</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <svg className="w-6 h-6 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>123 Innovation Dr,<br />Tech Valley, CA 94043</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} AI Powered Job Portal. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
