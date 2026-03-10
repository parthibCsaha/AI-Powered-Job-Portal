import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import companyService from '../services/companyService';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'CANDIDATE',
    fullName: '',
    phone: '',
    location: '',
    position: '',
    companyId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (formData.role === 'EMPLOYER') {
      fetchCompanies();
    }
  }, [formData.role]);

  const fetchCompanies = async () => {
    try {
      const response = await companyService.getAllCompanies(0, 100);
      setCompanies(response.data.content);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData = { ...formData };
      if (formData.role === 'CANDIDATE') {
        delete submitData.position;
        delete submitData.companyId;
      }
      if (formData.companyId) {
        submitData.companyId = parseInt(formData.companyId);
      }

      await register(submitData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all";
  const labelClasses = "block text-gray-300 font-medium mb-2 text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-2xl w-full glass-card rounded-2xl p-8 shadow-2xl border border-white/10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400">Join our community of professionals</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelClasses}>
              I am a
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'role', value: 'CANDIDATE' } })}
                className={`p-4 rounded-xl border transition-all ${formData.role === 'CANDIDATE'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-800/50 border-white/10 text-gray-400 hover:bg-slate-800'
                  }`}
              >
                <div className="text-lg font-semibold mb-1">Job Seeker</div>
                <div className="text-xs opacity-80">I'm looking for a job</div>
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'role', value: 'EMPLOYER' } })}
                className={`p-4 rounded-xl border transition-all ${formData.role === 'EMPLOYER'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-slate-800/50 border-white/10 text-gray-400 hover:bg-slate-800'
                  }`}
              >
                <div className="text-lg font-semibold mb-1">Employer</div>
                <div className="text-xs opacity-80">I'm hiring talent</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className={inputClasses}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className={labelClasses}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={inputClasses}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                className={inputClasses}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className={labelClasses}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className={inputClasses}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className={inputClasses}
              placeholder="City, Country"
            />
          </div>

          {formData.role === 'EMPLOYER' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Position/Title</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    required
                    className={inputClasses}
                    placeholder="HR Manager"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Company</label>
                  <select
                    name="companyId"
                    value={formData.companyId}
                    onChange={handleChange}
                    required
                    className={inputClasses}
                  >
                    <option value="" className="bg-slate-800">Select a company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id} className="bg-slate-800">
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all ${formData.role === 'EMPLOYER'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-purple-500/40'
                : 'btn-primary hover:shadow-blue-500/40'
              }`}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-400 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
