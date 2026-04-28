import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Users, ClipboardCheck, Loader2 } from 'lucide-react';
import api from '../../lib/api';

interface TaskConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: {
    id: string;
    category: string;
    summary: string;
    affected_count: number;
    location_name: string;
    latitude: number;
    longitude: number;
  } | null;
}

export const TaskConversionModal: React.FC<TaskConversionModalProps> = ({ isOpen, onClose, reportData }) => {
  const [isGenerating, setIsGenerating] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [priority, setPriority] = useState('High');

  useEffect(() => {
    if (isOpen && reportData) {
      setIsGenerating(true);
      
      const getSuggestions = async () => {
        try {
          const response = await api.post('/api/tasks/suggest', {
            category: reportData.category,
            summary: reportData.summary,
            affected_count: reportData.affected_count || 0,
            location: reportData.location_name
          });
          setFormData(response.data);
        } catch (error) {
          console.error("Failed to get suggestions:", error);
          setFormData({
            title: `Emergency ${reportData.category}`,
            skills: ['General Support'],
            volunteer_count: 5,
            briefing: 'Coordinate with site lead.'
          });
        } finally {
          setIsGenerating(false);
        }
      };
      
      getSuggestions();
    }
  }, [isOpen, reportData]);

  const handlePublish = async () => {
    if (!reportData || !formData) return;
    
    setIsPublishing(true);
    try {
      await api.post('/api/tasks', {
        report_id: reportData.id,
        title: formData.title,
        description: formData.briefing,
        category: reportData.category,
        priority: priority,
        skills_required: formData.skills,
        volunteer_needed: formData.volunteer_count,
        location_name: reportData.location_name,
        latitude: reportData.latitude,
        longitude: reportData.longitude
      });
      alert("Task published successfully! Local volunteers are being matched.");
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Failed to publish task:", error);
      alert("Error publishing task. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg border border-gray-200 animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary-600" />
            AI Task Proposal
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {isGenerating ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
              <p className="mt-4 text-sm font-bold text-gray-900 uppercase tracking-widest">Gemini is drafting task details...</p>
              <p className="text-xs text-gray-500 mt-1">Analyzing report scale and resource requirements.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-primary-50 border border-primary-100 p-3 flex items-center gap-3 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-primary-600" />
                <span className="text-xs font-bold text-primary-700 uppercase tracking-widest">AI Suggested Configuration</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Task Title</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 text-sm font-bold focus:outline-none focus:border-primary-500 rounded-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Volunteers Needed</label>
                    <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-gray-50 border border-gray-200">
                      <Users className="w-4 h-4 text-gray-400" />
                      <input 
                        type="number" 
                        value={formData.volunteer_count} 
                        onChange={(e) => setFormData({...formData, volunteer_count: parseInt(e.target.value)})}
                        className="bg-transparent text-sm font-bold w-full focus:outline-none" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Priority</label>
                    <select 
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 text-sm font-bold focus:outline-none"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Required Skills</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills.map((skill: string) => (
                      <span key={skill} className="px-2 py-1 bg-white border border-gray-200 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">AI Briefing (Draft)</label>
                  <textarea 
                    rows={4}
                    value={formData.briefing}
                    onChange={(e) => setFormData({...formData, briefing: e.target.value})}
                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex-1 btn btn-primary py-3 text-sm flex items-center justify-center gap-2"
                >
                  {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Task & Notify Volunteers'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
