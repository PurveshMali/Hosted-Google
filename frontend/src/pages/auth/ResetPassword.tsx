import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { ShieldCheck, Lock, ArrowRight, LogOut } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  
  // Try to get token from location state, or fallback to sessionStorage on refresh
  const [resetData] = useState<{reset_token?: string, user_id?: string}>(() => {
    const stateData = location.state as {reset_token?: string, user_id?: string};
    if (stateData?.reset_token) {
      sessionStorage.setItem('cp_reset_session', JSON.stringify(stateData));
      return stateData;
    }
    const saved = sessionStorage.getItem('cp_reset_session');
    return saved ? JSON.parse(saved) : {};
  });

  const handleLogout = () => {
    logout();
    sessionStorage.removeItem('cp_reset_session');
    navigate('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', {
        user_id: resetData.user_id,
        reset_token: resetData.reset_token,
        new_password: newPassword
      });
      
      sessionStorage.removeItem('cp_reset_session');
      alert('Password set successfully! Please log in with your new password.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!resetData.reset_token || !resetData.user_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 border border-gray-200 shadow-sm max-w-sm w-full">
          <p className="text-gray-500 mb-6 font-medium">Your reset session has expired or is invalid.</p>
          <button onClick={handleLogout} className="btn btn-primary w-full py-3">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary-100 flex items-center justify-center text-primary-600 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Secure Your Account</h1>
          <p className="text-gray-500 mt-2">Set your permanent password to continue.</p>
          <button 
            onClick={handleLogout}
            className="mt-4 text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1 uppercase tracking-widest"
          >
            <LogOut className="w-3 h-3" />
            Cancel & Logout
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 border border-gray-200 shadow-sm space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-medium border border-red-100">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-all"
                  placeholder="Min. 8 characters"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-all"
                  placeholder="Repeat your password"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full btn btn-primary py-3 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Updating...' : 'Set Permanent Password'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
