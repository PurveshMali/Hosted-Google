import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/ngo/Sidebar';
import { Header } from '../../components/ngo/Header';
import { StatsGrid } from '../../components/ngo/StatsGrid';
import { NeedCard } from '../../components/ngo/NeedCard';
import { Map as MapIcon, Filter, Layers, Loader2, ClipboardCheck, CheckCircle, ExternalLink } from 'lucide-react';
import { TaskConversionModal } from '../../components/ngo/TaskConversionModal';
import api from '../../lib/api';
import toast from 'react-hot-toast';

import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const center = reports.length > 0 
    ? { lat: reports[0].latitude, lng: reports[0].longitude }
    : { lat: 18.5529, lng: 73.9115 };

  const fetchData = async () => {
    try {
      const [reportsRes, tasksRes] = await Promise.all([
        api.get('/api/reports'),
        api.get('/api/tasks')
      ]);
      setReports(reportsRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConvert = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleIgnore = async (id: string) => {
    if (!window.confirm("Move this report to the ignored archive?")) return;
    const t = toast.loading("Archiving report...");
    try {
      await api.post(`/api/reports/${id}/ignore`);
      setReports(prev => prev.filter(r => r.id !== id));
      toast.success("Report archived", { id: t });
    } catch (err) {
      toast.error("Error archiving report.", { id: t });
    }
  };

  const handleVerifyTask = async (id: string) => {
    const t = toast.loading("Verifying and completing task...");
    try {
      await api.patch(`/api/tasks/${id}/complete`);
      toast.success("Task completed successfully!", { id: t });
      fetchData(); // Refresh everything
    } catch (err) {
      toast.error("Verification failed.", { id: t });
    }
  };

  const pendingVerification = tasks.filter(t => t.status === 'pending_completion');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <Header />
        
        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Strategic Overview</h1>
            <p className="text-gray-500 mt-1">Real-time crisis monitoring and resource coordination.</p>
          </div>

          <StatsGrid />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Map Section */}
              <div className="bg-white border border-gray-200 h-[500px] relative overflow-hidden flex flex-col shadow-sm">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 uppercase tracking-widest text-xs">
                    <MapIcon className="w-4 h-4 text-primary-600" />
                    Global Crisis Pins
                  </h3>
                </div>
                <div className="flex-1 bg-gray-100 relative">
                  {isLoaded ? (
                    <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={center} zoom={14} options={{ disableDefaultUI: true, zoomControl: true }}>
                      {reports.map((report) => (
                        <Marker key={report.id} position={{ lat: report.latitude, lng: report.longitude }} 
                          icon={{
                            path: window.google?.maps.SymbolPath.CIRCLE,
                            fillColor: report.urgency_score >= 8 ? '#dc2626' : report.urgency_score >= 5 ? '#f97316' : '#3b82f6',
                            fillOpacity: 0.9, strokeWeight: 2, strokeColor: '#ffffff', scale: 10
                          }}
                          onClick={() => handleConvert(report)}
                        />
                      ))}
                    </GoogleMap>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
                  )}
                </div>
              </div>

              {/* Task Verification Section */}
              {pendingVerification.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Awaiting Final Verification</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingVerification.map(task => (
                      <div key={task.id} className="bg-white border border-green-100 p-5 shadow-sm border-l-4 border-l-green-500">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-gray-900">{task.title}</h4>
                          <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 font-bold uppercase">Proof Submitted</span>
                        </div>
                        {task.proof_url && (
                          <div className="mb-4 aspect-video bg-gray-100 border border-gray-200 overflow-hidden relative group">
                            <img src={task.proof_url} alt="Proof" className="w-full h-full object-cover" />
                            <a href={task.proof_url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-xs font-bold gap-2">
                              <ExternalLink className="w-4 h-4" /> View Full Resolution
                            </a>
                          </div>
                        )}
                        <p className="text-xs text-gray-600 italic mb-4">"{task.volunteer_notes}"</p>
                        <button 
                          onClick={() => handleVerifyTask(task.id)}
                          className="w-full py-2 bg-green-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve & Complete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reports Sidebar */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs">Recent AI Reports</h3>
                <span className="text-[10px] font-bold text-primary-600 px-2 py-1 bg-primary-50 uppercase tracking-widest">{reports.length} New</span>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-[700px] pr-2">
                {isLoading ? (
                  <div className="text-center py-10 flex flex-col items-center gap-2"><Loader2 className="w-6 h-6 text-gray-300 animate-spin" /><p className="text-gray-400 text-xs uppercase font-bold tracking-tighter">Syncing Intelligence...</p></div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-20 bg-white border border-dashed border-gray-200"><p className="text-gray-400 text-sm font-medium">Clear Skies. No pending reports.</p></div>
                ) : (
                  reports.map((report) => (
                    <NeedCard 
                      key={report.id} id={report.id}
                      category={report.category || 'other'} urgency={report.urgency_score || 5.0}
                      scale={report.affected_count ? `${report.affected_count} affected` : 'Unknown Scale'}
                      location={report.location_name}
                      timestamp={new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      summary={report.ai_summary || report.description}
                      status={report.status} image_url={report.image_url}
                      onConvert={() => handleConvert(report)} onIgnore={() => handleIgnore(report.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <TaskConversionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} reportData={selectedReport} onRefresh={fetchData} />
      </main>
    </div>
  );
};

export default Dashboard;
