import React, { useState, useEffect } from 'react';
import { AlertCircle, Users, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react';
import api from '../../lib/api';

export const StatsGrid: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/ngo/stats');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    {
      label: 'Urgent Needs',
      value: data?.urgent_needs ?? '0',
      change: data?.recent_activity ?? 'Syncing...',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Active Volunteers',
      value: data?.active_volunteers ?? '0',
      change: 'Currently registered',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Tasks Completed',
      value: data?.tasks_completed ?? '0',
      change: 'Successfully closed',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Impact Score',
      value: data?.impact_score ?? '9.0',
      change: 'Calculated by AI',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-gray-200 p-6 flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-gray-200 animate-spin" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white border border-gray-200 p-6 rounded-none shadow-sm hover:border-primary-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
            <div className={`p-3 ${stat.bgColor} ${stat.color} rounded-none`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[10px] font-bold uppercase tracking-wider">
            <span className={stat.color}>{stat.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
