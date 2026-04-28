import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MapPin, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  X
} from 'lucide-react';
import api from '../../lib/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { Header } from '../../components/ngo/Header';

export const ReportNeed: React.FC = () => {
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition((pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setIsLocating(false);
        setLocationName("Current Location Captured");
      }, () => setIsLocating(false));
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) {
      toast.error("Cloudinary config missing.");
      return;
    }

    const t = toast.loading("Uploading photo proof...");
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset || 'ml_default');

    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData);
      setImageUrl(res.data.secure_url);
      toast.success("Photo uploaded!", { id: t });
    } catch (err) {
      toast.error("Upload failed.", { id: t });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!description || description.length < 10) {
      toast.error("Provide more detail for AI analysis.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const response = await api.post('/api/reports/extract', { description });
      setAiAnalysis(response.data);
      toast.success("AI Analysis Complete", { icon: '🤖' });
    } catch (err) {
      toast.error("AI Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lat || !lng) {
      toast.error("GPS location required.");
      return;
    }

    const t = toast.loading("Submitting report to HQ...");
    setIsSubmitting(true);
    try {
      await api.post('/api/needs/submit', {
        description,
        location_name: locationName,
        latitude: lat,
        longitude: lng,
        image_url: imageUrl
      });
      toast.success("Report Transmitted Successfully!", { id: t });
      setDescription('');
      setImageUrl(null);
      setAiAnalysis(null);
    } catch (error: any) {
      toast.error("Submission failed.", { id: t });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Report Ground Need</h2>
          <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest font-bold">Field Intelligence Portal</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Situation Description</label>
              <textarea
                className="w-full p-5 bg-white border border-gray-200 text-sm focus:outline-none focus:border-primary-500 transition-all min-h-[160px] leading-relaxed shadow-sm rounded-none"
                placeholder="Describe the urgent need..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={handleAiAnalysis}
                disabled={isAnalyzing}
                className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-primary-900 text-white text-[10px] font-bold uppercase tracking-widest border border-primary-800 hover:bg-black transition-all disabled:opacity-50 shadow-lg"
              >
                {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Strategic Analysis
              </button>
            </div>

            {aiAnalysis && (
              <div className="bg-primary-900 p-5 border border-primary-800 animate-in slide-in-from-top-2">
                <h4 className="text-[10px] font-bold text-primary-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  AI Classification
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-primary-400 uppercase tracking-tighter">Category</p>
                    <p className="text-sm font-bold text-white capitalize">{aiAnalysis.category}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-primary-400 uppercase tracking-tighter">Urgency</p>
                    <p className="text-sm font-bold text-white">{aiAnalysis.urgency_score}/10</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location Data</p>
                    <p className="text-xs font-bold text-gray-900">{isLocating ? 'Acquiring GPS...' : locationName}</p>
                  </div>
                </div>
                {lat && <p className="text-[10px] font-mono text-gray-400">Lat: {lat.toFixed(4)}, Lng: {lng?.toFixed(4)}</p>}
              </div>

              <div className="bg-white border border-gray-200 p-4 shadow-sm relative overflow-hidden group">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                
                {imageUrl ? (
                  <div className="relative h-full min-h-[60px]">
                    <img src={imageUrl} alt="Upload Preview" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setImageUrl(null)} className="absolute top-1 right-1 bg-red-600 text-white p-1 shadow-lg">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full h-full flex flex-col items-center justify-center gap-2 py-4 text-xs font-bold text-gray-500 hover:text-primary-600 transition-colors">
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    {isUploading ? 'Uploading...' : 'Add Ground Photo'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !lat || isUploading}
            className="w-full py-4 bg-primary-600 text-white text-sm font-bold uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center justify-center gap-3 shadow-lg disabled:bg-gray-300"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isSubmitting ? 'Transmitting...' : 'Transmit Official Report'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default ReportNeed;
