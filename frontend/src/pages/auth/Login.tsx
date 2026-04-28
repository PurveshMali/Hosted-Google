import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { LogIn, ArrowRight, Chrome, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.must_reset_password) {
        // Redirect to reset password with the token
        navigate('/reset-password', { 
          state: { 
            reset_token: res.data.reset_token,
            user_id: res.data.user_id 
          } 
        });
        return;
      }
      
      const { user, access_token } = res.data;
      login(user, access_token);
      
      // Redirect based on role
      if (user.role === 'ngo_admin') navigate('/ngo/dashboard');
      else if (user.role === 'volunteer') navigate('/volunteer');
      else navigate('/reporter/report');
      
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Too many attempts. Please try again in 15 minutes.');
      } else {
        setError(err.response?.data?.detail || 'Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-primary-600 mx-auto flex items-center justify-center text-white font-black text-xl mb-4">CP</div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-2">Sign in to your CommunityPulse account.</p>
        </div>

        <div className="space-y-4">
          {/* OAuth Placeholder - To be connected if needed */}
          <button 
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 p-3 font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            onClick={() => alert('OAuth is being integrated with the new backend. Please use email for now.')}
          >
            <Chrome className="w-5 h-5 text-red-500" />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 text-gray-300">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">or use email</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          <form onSubmit={handleLogin} className="bg-white p-8 border border-gray-200 shadow-sm space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-medium border border-red-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-all"
                  placeholder="name@organization.org"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Password</label>
                  <a href="#" className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:underline">Forgot?</a>
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full btn btn-primary py-3 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              {!isLoading && <LogIn className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Don't have an account? <Link to="/signup" className="text-primary-600 font-bold hover:underline">Create one for free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
