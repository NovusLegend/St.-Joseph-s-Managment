
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Club } from '../types';
import { Users, Plus, Calendar, Loader2, Search, X } from 'lucide-react';

export const ClubsManager: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClub, setNewClub] = useState<Partial<Club>>({ category: 'General', meeting_day: 'Friday' });
  const [submitting, setSubmitting] = useState(false);

  // Error Helper
  const getErrorMessage = (error: any) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error_description) return error.error_description;
    return "An unexpected error occurred.";
  };

  const fetchClubs = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase.from('clubs').select('*').order('name');
        if (error) throw error;
        if (data) {
            setClubs(data as Club[]);
        }
    } catch (err) {
        console.warn("Error fetching clubs:", err);
        if (clubs.length === 0) {
            // Keep empty state clean or fallback if desired
        }
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
      
      try {
        const { error } = await supabase.from('clubs').insert([newClub]);
        if (error) throw error;
        
        await fetchClubs(); // Refresh list
        setIsModalOpen(false);
        setNewClub({ category: 'General', meeting_day: 'Friday' }); // Reset form
      } catch (err: any) {
          const msg = getErrorMessage(err);
          
          // GRACEFUL DEGRADATION:
          // If the database is missing columns, try to insert WITHOUT them so the app still works.
          if (msg.includes('schema cache') || msg.includes('category') || msg.includes('meeting_day')) {
             try {
                 console.warn("Attempting fallback insert due to schema mismatch...");
                 const fallbackClub = { ...newClub };
                 // Remove the fields that might be missing in the DB
                 delete fallbackClub.category;
                 delete fallbackClub.meeting_day;

                 const { error: fallbackError } = await supabase.from('clubs').insert([fallbackClub]);
                 if (fallbackError) throw fallbackError;

                 await fetchClubs();
                 setIsModalOpen(false);
                 setNewClub({ category: 'General', meeting_day: 'Friday' });
                 
                 alert("Club created successfully!\n\nNote: 'Category' and 'Meeting Day' were not saved because your database needs an update. Please run the script in SQL.txt when possible.");
                 return;
             } catch (retryErr) {
                 // If fallback also fails, just show the original update message
             }

             alert("Database Update Required: Your 'clubs' table is missing columns. Please run the script in SQL.txt (Section 11) in your Supabase SQL Editor.");
          } else {
             alert(`Failed to create club: ${msg}`);
          }
      } finally {
          setSubmitting(false);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
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

        {/* Search Bar */}
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Search clubs by name or category..." 
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none shadow-sm bg-white"
            />
        </div>

        {/* Clubs Grid */}
        {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map((club) => (
                    <div key={club.id} className="glass-card p-6 rounded-2xl group hover:shadow-xl transition-all border border-white/60 bg-white/80">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${
                                club.category === 'Science' ? 'bg-blue-100 text-blue-600' :
                                club.category === 'Arts' ? 'bg-pink-100 text-pink-600' :
                                club.category === 'Sports' ? 'bg-orange-100 text-orange-600' :
                                'bg-violet-100 text-violet-600'
                            }`}>
                                <Users size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                {club.category || 'General'}
                            </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{club.name}</h3>
                        <p className="text-slate-500 text-sm mb-6 line-clamp-2 h-10">{club.description || 'No description provided.'}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                                <Calendar size={14} className="text-indigo-500" />
                                <span className="font-medium">{club.meeting_day || 'TBA'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                <Users size={16} />
                                <span>{club.member_count || 0}</span>
                            </div>
                        </div>
                    </div>
                ))}
                
                {clubs.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400 bg-white/50 rounded-2xl border border-dashed border-slate-300">
                        <Users size={48} className="mx-auto mb-2 opacity-50" />
                        <p>No clubs found. Create the first one!</p>
                    </div>
                )}
            </div>
        )}

        {/* Create Modal */}
        {isModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div 
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                    onClick={() => setIsModalOpen(false)}
                ></div>
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in transform transition-all">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xl font-bold text-slate-900">Create New Club</h3>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
                    </div>
                    
                    <form onSubmit={handleCreateClub} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Club Name</label>
                            <input 
                                required 
                                type="text"
                                placeholder="e.g. Wildlife Club"
                                value={newClub.name || ''} 
                                onChange={e => setNewClub({...newClub, name: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <div className="relative">
                                    <select 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                                        value={newClub.category}
                                        onChange={e => setNewClub({...newClub, category: e.target.value})}
                                    >
                                        <option value="General">General</option>
                                        <option value="Arts">Arts & Culture</option>
                                        <option value="Science">Science & Tech</option>
                                        <option value="Sports">Sports</option>
                                        <option value="Community">Community</option>
                                        <option value="Religious">Religious</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Day</label>
                                <div className="relative">
                                    <select 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                                        value={newClub.meeting_day || ''}
                                        onChange={e => setNewClub({...newClub, meeting_day: e.target.value})}
                                    >
                                        <option value="Monday">Monday</option>
                                        <option value="Tuesday">Tuesday</option>
                                        <option value="Wednesday">Wednesday</option>
                                        <option value="Thursday">Thursday</option>
                                        <option value="Friday">Friday</option>
                                        <option value="Saturday">Saturday</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea 
                                value={newClub.description || ''} 
                                onChange={e => setNewClub({...newClub, description: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                rows={3}
                                placeholder="What is this club about?"
                            />
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Create Club'}
                            </button>
                        </div>
                    </form>
                </div>
             </div>
        )}
    </div>
  );
};
