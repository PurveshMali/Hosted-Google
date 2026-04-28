import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, Heart, UserCircle, 
  ArrowRight, CheckCircle2, MapPin, 
  Settings, Loader2 
} from 'lucide-react';

type Tab = 'ngo' | 'volunteer' | 'community';

export const Signup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('ngo');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // NGO/Community Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');

  // Volunteer Specific Fields
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const skillOptions = [
    'Medical', 'Physical Relief', 'Education', 
    'Food Distribution', 'Communication', 'Technical Support'
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = toast.loading("Creating your profile...");
    setIsLoading(true);

    try {
      if (activeTab === 'volunteer') {
        if (!lat || !lng) {
          toast.error("Please capture your location for task matching", { id: t });
          setIsLoading(false);
          return;
        }
        await api.post('/auth/register/volunteer', {
          email, password, full_name: fullName, phone,
          skills, home_lat: lat, home_lng: lng,
          preferred_radius_km: 15, languages: ['English']
        });
      } else {
        await api.post('/auth/register', {
          email, password, full_name: fullName,
          role: activeTab === 'ngo' ? 'ngo_admin' : 'community_member',
          org_name: activeTab === 'ngo' ? orgName : undefined
        });
      }
      toast.success("Account created successfully!", { id: t });
      setSuccess(true);
    } catch (err: any) {
      console.error('Signup failed:', err);
      toast.error(err.response?.data?.detail || 'Registration failed. Please check your data.', { id: t });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      toast.promise(
        new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setLat(pos.coords.latitude);
              setLng(pos.coords.longitude);
              resolve(pos);
            },
            (err) => reject(err)
          );
        }),
        {
          loading: 'Fetching location...',
          success: 'Location captured!',
          error: 'Failed to get location. Please allow GPS access.'
        }
      );
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
        <CheckCircle2 className="w-20 h-20 text-primary-600 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900">Account Created!</h1>
        <p className="text-gray-500 mt-2 text-center max-w-sm">
          Welcome to the community. You can now sign in to start your journey.
        </p>
        <button 
          onClick={() => navigate('/login')}
          className="mt-8 btn btn-primary px-10 py-3 flex items-center gap-2 font-bold shadow-lg"
        >
          Go to Login <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-12 h-12 bg-primary-600 mx-auto flex items-center justify-center text-white font-black text-xl mb-4">CP</div>
          <h1 className="text-3xl font-bold text-gray-900">Join CommunityPulse</h1>
          <p className="text-gray-500 mt-2">Select your role to get started.</p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <TabButton 
            active={activeTab === 'ngo'} 
            onClick={() => setActiveTab('ngo')}
            icon={<ShieldCheck className="w-5 h-5" />}
            title="NGO Admin"
          />
          <TabButton 
            active={activeTab === 'volunteer'} 
            onClick={() => setActiveTab('volunteer')}
            icon={<Heart className="w-5 h-5" />}
            title="Volunteer"
          />
          <TabButton 
            active={activeTab === 'community'} 
            onClick={() => setActiveTab('community')}
            icon={<UserCircle className="w-5 h-5" />}
            title="Community"
          />
        </div>

        <form onSubmit={handleSignup} className="bg-white p-8 border border-gray-200 shadow-xl max-w-2xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Full Name" value={fullName} onChange={setFullName} placeholder="e.g. Rajesh Kumar" />
            <InputField label="Email Address" type="email" value={email} onChange={setEmail} placeholder="name@example.com" />
            <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" />
            
            {activeTab === 'ngo' && (
              <InputField label="Organization Name" value={orgName} onChange={setOrgName} placeholder="e.g. Relief India" />
            )}

            {activeTab === 'volunteer' && (
              <>
                <InputField label="Phone Number" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Your Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {skillOptions.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])}
                        className={`px-4 py-2 text-sm border transition-all font-medium ${
                          skills.includes(skill) ? 'bg-primary-600 text-white border-primary-600 shadow-md' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 p-4 bg-primary-50 border border-primary-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-primary-900">Home Location</h4>
                    <p className="text-xs text-primary-700">Required for accurate task matching</p>
                  </div>
                  <button type="button" onClick={getUserLocation} className="btn bg-white text-primary-600 border-primary-200 hover:bg-primary-100 flex items-center gap-2 py-2 px-4 text-xs font-bold shadow-sm transition-all">
                    <MapPin className="w-4 h-4" />
                    {lat ? 'Location Fixed' : 'Capture GPS'}
                  </button>
                </div>
              </>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full btn btn-primary py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Strategic Account'}
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link to="/login" className="text-primary-600 font-bold hover:underline">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, title: string }> = ({ active, onClick, icon, title }) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-4 flex flex-col items-center gap-2 border transition-all ${
      active 
        ? 'bg-white border-primary-600 text-primary-600 shadow-lg scale-105 z-10' 
        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300'
    }`}
  >
    {icon}
    <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
  </button>
);

const InputField: React.FC<{ label: string, type?: string, value: string, onChange: (val: string) => void, placeholder: string }> = ({ label, type = 'text', value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required
      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-primary-500 focus:bg-white transition-all rounded-none"
    />
  </div>
);

export default Signup;
