import React, { useState, useEffect } from 'react';
import { Bell, Search, User, X, Check, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export const Header: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      toast.error("Failed to clear notification");
    }
  };

  const clearAll = async () => {
    try {
      await api.post('/api/notifications/clear-all');
      setNotifications([]);
      setShowDropdown(false);
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error("Failed to clear all");
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search intelligence, tasks, or personnel..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-none text-sm focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className={`relative p-2 transition-all ${showDropdown ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white animate-bounce">
                {notifications.length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Intelligence Feed</h3>
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-[10px] font-bold text-primary-600 hover:underline flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center gap-2">
                    <Check className="w-8 h-8 text-gray-200" />
                    <p className="text-xs text-gray-400 font-medium">System is synchronized. No new alerts.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-4 border-b border-gray-100 hover:bg-primary-50/50 transition-colors group relative">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{notif.title}</h4>
                        <button onClick={() => markAsRead(notif.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed font-medium">{notif.message}</p>
                      <p className="text-[9px] text-gray-400 mt-2 uppercase font-bold">{new Date(notif.created_at).toLocaleTimeString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900">{user?.full_name || 'Personnel'}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {user?.role === 'ngo_admin' ? 'Strategic Coordinator' : 'Field Agent'}
            </p>
          </div>
          <div className="w-10 h-10 bg-primary-900 text-white flex items-center justify-center border border-primary-800 shadow-md">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
};
