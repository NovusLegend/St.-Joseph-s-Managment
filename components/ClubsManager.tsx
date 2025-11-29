
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Club } from '../types';
import { Users, Plus, Calendar, BookOpen, Loader2, Search, X } from 'lucide-react';

export const ClubsManager: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClub, setNewClub] = useState<Partial<Club>>({ category: 'General' });
  const [submitting, setSubmitting] = useState(false);

  const fetchClubs = async () => {
    setLoading(true);
    // Try to fetch from DB
    try {
        const { data, error } = await supabase.from('clubs').select('*');
        if (error) throw error;
        if (data) {
            setClubs(data as Club[]);
        }
    } catch (err) {
        // Fallback for demo if table doesn't exist
        console.warn("Clubs table might be missing, using mock data.", err);
        setClubs([
            { id: '1', name: 'Writers Club', category: 'Arts', description: 'For aspiring poets and storytellers.', meeting_day: 'Thursday', member_count: 24 },
            { id: '2', name: 'Wildlife Club', category: 'Environment', description: 'Conservation and nature walks.', meeting_day: 'Friday', member_count: 45 },
            { id: '3', name: 'Interact Club', category: 'Community', description: 'Service above self.', meeting_day: 'Saturday', member_count: 120 },
            { id: '4', name: 'STEM Robotics', category: 'Science', description: 'Building the future, one bot at a time.', meeting_day: 'Tuesday', member_count: 18 },
        ]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleCreateClub = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      // Attempt DB Insert
      try {
        const { error } = await supabase.from('clubs').insert([newClub]);
        if (error) throw error;
        fetchClubs(); // Refresh
        setIsModalOpen(false);
        setNewClub({ category: 'General' });
      } catch (err) {
          alert("Could not create club (Database table 'clubs' may be missing).");
          // Add to local state for demo
          setClubs(prev => [...prev, { ...newClub, id: Math.random().toString(), member_count: 0 } as Club]);
          setIsModalOpen(false);
      } finally {
          setSubmitting(false);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Clubs & Societies</h2>
            <p className="text-slate-500 mt-1">Manage student extracurricular activities and communities.</p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
            >
                <Plus size={18} />
                New Club
            </button>
        </div>

        {/* Search / Filter (Visual only for demo) */}
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Search clubs..." 
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none shadow-sm"
            />
        </div>

        {/* Clubs Grid */}
        {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map((club) => (
                    <div key={club.id} className="glass-card p-6 rounded-2xl group hover:shadow-lg transition-all border border-white/50">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${
                                club.category === 'Science' ? 'bg-blue-100 text-blue-600' :
                                club.category === 'Arts' ? 'bg-pink-100 text-pink-600' :
                                club.category === 'Sports' ? 'bg-orange-100 text-orange-600' :
                                'bg-violet-100 text-violet-600'
                            }`}>
                                <Users size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-lg">
                                {club.category}
                            </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{club.name}</h3>
                        <p className="text-slate-500 text-sm mb-6 line-clamp-2">{club.description}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Calendar size={16} className="text-indigo-400" />
                                <span>{club.meeting_day || 'TBA'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Users size={16} className="text-indigo-400" />
                                <span>{club.member_count || 0} Members</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Create Modal */}
        {isModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div 
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                    onClick={() => setIsModalOpen(false)}
                ></div>
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-900">Create New Club</h3>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleCreateClub} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Club Name</label>
                            <input 
                                required 
                                value={newClub.name || ''} 
                                onChange={e => setNewClub({...newClub, name: e.target.value})}
                                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select 
                                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                value={newClub.category}
                                onChange={e => setNewClub({...newClub, category: e.target.value})}
                            >
                                <option>General</option>
                                <option>Arts</option>
                                <option>Science</option>
                                <option>Sports</option>
                                <option>Community</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea 
                                value={newClub.description || ''} 
                                onChange={e => setNewClub({...newClub, description: e.target.value})}
                                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                rows={3}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex justify-center"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : 'Create Club'}
                        </button>
                    </form>
                </div>
             </div>
        )}
    </div>
  );
};
