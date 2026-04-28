import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Sidebar } from '../../components/ngo/Sidebar';
import { UserPlus, Mail, Phone, Trash2, Send, CheckCircle2, Clock } from 'lucide-react';

const TeamManagement: React.FC = () => {
  const [reporters, setReporters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReporters();
  }, []);

  const fetchReporters = async () => {
    try {
      const res = await api.get('/ngo/reporters');
      setReporters(res.data);
    } catch (err) {
      console.error('Failed to fetch reporters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReporter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/ngo/reporters', {
        full_name: name,
        email: email,
        phone: phone
      });
      
      alert(`✅ Success!\n\nAn invitation has been sent to ${name} (${email}).\n\nFor your records, their temporary password is: ${res.data.temp_password}`);
      
      setShowModal(false);
      setName('');
      setEmail('');
      setPhone('');
      fetchReporters();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add reporter');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reporterId: string, reporterName: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${reporterName}? They will no longer be able to submit reports.`)) {
      return;
    }

    try {
      await api.delete(`/ngo/reporters/${reporterId}`);
      fetchReporters();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to deactivate reporter');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Field Reporters</h1>
              <p className="text-sm text-gray-500">Manage your ground team and invitations.</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="btn btn-primary flex items-center gap-2 py-2 px-4"
            >
              <UserPlus className="w-4 h-4" />
              Add Reporter
            </button>
          </header>

          <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reporters.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No field reporters yet. Add your first reporter to start collecting data.
                    </td>
                  </tr>
                ) : (
                  reporters.map((reporter) => (
                    <tr key={reporter.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{reporter.full_name}</div>
                        <div className="text-xs text-gray-500">ID: {reporter.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-3 h-3" /> {reporter.email}
                        </div>
                        {reporter.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Phone className="w-3 h-3" /> {reporter.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {reporter.must_reset_password ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" /> Invited
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleDelete(reporter.id, reporter.full_name)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Reporter Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <div className="bg-white max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Invite New Reporter</h3>
              <p className="text-sm text-gray-500 mb-6">A temporary password will be generated for them.</p>
              
              <form onSubmit={handleAddReporter} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Full Name</label>
                  <input 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    placeholder="e.g. Sunita Deshmukh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Email</label>
                  <input 
                    required 
                    type="email"
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    placeholder="sunita@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Phone (Optional)</label>
                  <input 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    placeholder="For WhatsApp notifications"
                  />
                </div>

                <div className="flex gap-3 mt-8">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 border border-gray-200">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 btn btn-primary flex items-center justify-center gap-2">
                    {isSubmitting ? 'Adding...' : 'Send Invitation'}
                    {!isSubmitting && <Send className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeamManagement;
