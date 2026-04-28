import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Zap, Clock, ShieldCheck, LogOut, Loader2, Camera, Send, X, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

interface Task {
  id: string;
  title: string;
  skills_required: string[];
  distance_km: number;
  match_score: number;
  priority: string;
  description: string;
  status: string;
  accepted?: boolean;
}

export const VolunteerHome: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success("Logged out successfully");
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/api/tasks/matched');
      setTasks(response.data);
    } catch (error) {
      console.error("Failed to fetch matched tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAccept = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, accepted: true } : t));
    setActiveTaskId(id);
    toast.success("Task accepted! Get to the location and start the mission.");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const t = toast.loading("Uploading completion proof...");
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset || 'ml_default');

    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData);
      setProofUrl(res.data.secure_url);
      toast.success("Proof photo uploaded!", { id: t });
    } catch (err) {
      toast.error("Upload failed.", { id: t });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!proofUrl || !activeTaskId) return;

    setIsSubmittingProof(true);
    const t = toast.loading("Submitting final proof to HQ...");
    try {
      await api.post(`/api/tasks/${activeTaskId}/proof`, {
        proof_url: proofUrl,
        volunteer_notes: "Task completed as requested."
      });
      toast.success("Mission complete! Awaiting HQ verification.", { id: t });
      setProofUrl(null);
      setActiveTaskId(null);
      fetchTasks();
    } catch (err) {
      toast.error("Submission failed.", { id: t });
    } finally {
      setIsSubmittingProof(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 flex items-center justify-center text-white font-bold text-xs">CP</div>
            <h1 className="text-lg font-bold text-gray-900">Volunteer</h1>
          </div>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6">
        {/* Active Task Management */}
        {activeTaskId && (
          <div className="bg-primary-900 text-white p-6 rounded-none shadow-xl border-l-4 border-cyan-400">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-300">Active Mission</h3>
              <Clock className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
            <p className="text-lg font-bold mb-4">{tasks.find(t => t.id === activeTaskId)?.title}</p>
            
            <div className="space-y-4">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              
              {!proofUrl ? (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-3 bg-white/10 border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {isUploading ? 'Uploading...' : 'Take Completion Photo'}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative aspect-video w-full bg-black/20 overflow-hidden border border-white/10">
                    <img src={proofUrl} alt="Proof" className="w-full h-full object-cover" />
                    <button onClick={() => setProofUrl(null)} className="absolute top-2 right-2 bg-red-600 p-1"><X className="w-3 h-3" /></button>
                  </div>
                  <button 
                    onClick={handleSubmitProof}
                    disabled={isSubmittingProof}
                    className="w-full py-3 bg-cyan-500 text-primary-900 hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
                  >
                    {isSubmittingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit Proof of Work
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold text-gray-900">Personalised Feed</h2>
          <p className="text-sm text-gray-500">Tasks matched to your skills and location.</p>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              <p className="text-gray-400 text-sm">Scanning for nearby crises...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 p-8">
              <p className="text-gray-400 text-sm font-medium">No tasks near you right now.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className={`bg-white border ${task.accepted ? 'border-primary-200 bg-primary-50/20' : 'border-gray-200'} p-5 rounded-none relative overflow-hidden shadow-sm transition-all`}
              >
                {!task.accepted && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-primary-600 text-white text-[10px] font-bold py-1 px-3 flex items-center gap-1 uppercase tracking-widest">
                      <Zap className="w-3 h-3 fill-current" />
                      {Math.round(task.match_score * 100)}% Match
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 ${task.priority === 'Critical' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {task.distance_km} km away
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{task.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{task.description}</p>

                  <div className="pt-4 border-t border-gray-100 mt-2">
                    {task.accepted ? (
                      <div className="flex items-center gap-2 text-primary-600 font-bold text-sm uppercase tracking-widest">
                        <CheckCircle className="w-4 h-4" />
                        In Progress
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleAccept(task.id)}
                          className="flex-1 btn btn-primary py-2.5 text-sm font-bold shadow-md"
                        >
                          Accept Mission
                        </button>
                        <button className="px-4 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">
                          Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-primary-900 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary-300">Community Impact</h4>
            <ShieldCheck className="w-4 h-4 text-primary-300" />
          </div>
          <p className="text-3xl font-bold">{user?.impact_score || '0'}</p>
          <p className="text-xs text-primary-200 mt-1 uppercase tracking-wider">Lives Positively Impacted</p>
        </div>
      </main>
    </div>
  );
};

export default VolunteerHome;
