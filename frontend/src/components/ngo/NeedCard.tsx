import React from 'react';
import { Clock, MapPin, Users, ArrowRight, Eye } from 'lucide-react';

interface NeedProps {
  id: string;
  category: string;
  urgency: number;
  scale: string;
  location: string;
  timestamp: string;
  summary: string;
  status: 'pending' | 'verified' | 'converted';
  image_url?: string;
  onConvert?: () => void;
  onIgnore?: () => void;
}

export const NeedCard: React.FC<NeedProps> = ({
  category,
  urgency,
  scale,
  location,
  timestamp,
  summary,
  image_url,
  onConvert,
  onIgnore
}) => {
  const getUrgencyColor = (score: number) => {
    if (score >= 8) return 'bg-red-600';
    if (score >= 5) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-white border border-gray-200 p-5 rounded-none hover:border-primary-400 transition-colors group shadow-sm">
      {/* Photo Preview if exists */}
      {image_url && (
        <div className="mb-4 h-32 w-full overflow-hidden border border-gray-100 bg-gray-50 relative group/img">
          <img src={image_url} alt="Ground Proof" className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
            <a href={image_url} target="_blank" rel="noreferrer" className="text-white text-xs font-bold flex items-center gap-1">
              <Eye className="w-3 h-3" /> View Full Proof
            </a>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider ${getUrgencyColor(urgency)}`}>
            Urgency {urgency}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-bold text-gray-600 bg-gray-100 uppercase tracking-wider">
            {category}
          </span>
        </div>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {timestamp}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 group-hover:text-primary-600 transition-colors">
        {summary}
      </h3>
      
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400" />
          {location}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4 text-gray-400" />
          {scale}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onConvert}
          className="flex-1 btn btn-primary flex items-center justify-center gap-2 text-sm font-bold shadow-md"
        >
          Convert to Task
          <ArrowRight className="w-4 h-4" />
        </button>
        <button 
          onClick={onIgnore}
          className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all rounded-none"
        >
          Ignore
        </button>
      </div>
    </div>
  );
};
