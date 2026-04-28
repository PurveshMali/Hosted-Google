import React from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  ClipboardList, 
  Users, 
  BarChart3, 
  Settings,
  LogOut
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/ngo/dashboard' },
  { icon: Users, label: 'Team Management', path: '/ngo/team' },
  { icon: MapIcon, label: 'Need Heatmap', path: '/ngo/heatmap' },
  { icon: ClipboardList, label: 'Task Management', path: '/ngo/tasks' },
  { icon: BarChart3, label: 'Impact Reports', path: '/ngo/reports' },
  { icon: Settings, label: 'Settings', path: '/ngo/settings' },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      useAuthStore.getState().logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed');
      useAuthStore.getState().logout();
      navigate('/login');
    }
  };

  return (
    <aside className="hidden lg:flex w-64 h-screen bg-white border-r border-gray-200 flex-col fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-none flex items-center justify-center text-white font-bold">
            CP
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">CommunityPulse</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-none ${
              location.pathname === item.path 
                ? 'bg-primary-50 text-primary-700 border-r-4 border-primary-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors rounded-none"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};
