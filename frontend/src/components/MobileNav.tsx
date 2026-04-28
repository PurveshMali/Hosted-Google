import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Map as MapIcon, 
  ClipboardList,
  User
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  // Define navigation based on role
  const getNavItems = () => {
    if (user?.role === 'ngo_admin' || user?.role === 'super_admin') {
      return [
        { icon: LayoutDashboard, label: 'Home', path: '/ngo/dashboard' },
        { icon: Users, label: 'Team', path: '/ngo/team' },
        { icon: MapIcon, label: 'Map', path: '/ngo/heatmap' },
        { icon: ClipboardList, label: 'Tasks', path: '/ngo/tasks' },
      ];
    }
    if (user?.role === 'volunteer') {
      return [
        { icon: LayoutDashboard, label: 'Home', path: '/volunteer' },
        { icon: ClipboardList, label: 'Tasks', path: '/volunteer/tasks' },
        { icon: User, label: 'Profile', path: '/volunteer/profile' },
      ];
    }
    return [
      { icon: LayoutDashboard, label: 'Home', path: '/reporter/report' },
      { icon: MapIcon, label: 'Reports', path: '/reporter/my-reports' },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-6 py-3 z-50 pb-safe">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-primary-600 scale-110' : 'text-gray-400'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'fill-primary-50' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
