
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { SchoolEvent } from '../types';
import { CalendarDays, Plus, MapPin, Users, Loader2, X, Clock } from 'lucide-react';

export const SchoolEventsManager: React.FC = () => {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [newEvent, setNewEvent] = useState<Partial<SchoolEvent>>({
      audience: 'all',
      event_date: new Date().toISOString().split('T')[0]
  });

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('school_events').select('*').order('event_date', { ascending: true });
    if (data) setEvents(data as SchoolEvent[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
        const { error } = await supabase.from('school_events').insert([newEvent]);
        if (error) throw error;
        await fetchEvents();
        setIsModalOpen(false);
        setNewEvent({ audience: 'all', event_date: new Date().toISOString().split('T')[0] });
    } catch (err: any) {
        alert(err.message || "Failed to create event. Run SQL.txt updates if this persists.");
    } finally {
        setSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">School Events</h2>
                <p className="text-slate-500 mt-1">Manage calendar, assemblies, and public notices.</p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
            >
                <Plus size={18} />
                Create Event
            </button>
        </div>

        {/* Events Grid */}
        {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((evt) => (
                    <div key={evt.id} className="glass-card p-6 rounded-2xl group border border-white/60 bg-white/80 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                        
                        <div className="pl-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded-lg">
                                    {evt.audience}
                                </span>
                                <div className="flex items-center gap-1 text-slate-400 text-xs">
                                    <Clock size={12} />
                                    {formatDate(evt.event_date)}
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">{evt.title}</h3>
                            <p className="text-slate-500 text-sm mb-4 line-clamp-3">{evt.description}</p>
                            
                            <div className="flex items-center gap-2 text-sm text-slate-600 mt-auto">
                                <MapPin size={16} className="text-slate-400" />
                                <span>{evt.location}</span>
                            </div>
                        </div>
                    </div>
                ))}
                
                {events.length === 0 && (
                    <div className="col-span-full text-center py-16 text-slate-400 bg-white/50 rounded-2xl border border-dashed border-slate-300">
                        <CalendarDays size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No upcoming events scheduled.</p>
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
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xl font-bold text-slate-900">Add New Event</h3>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
                    </div>
                    
                    <form onSubmit={handleCreateEvent} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
                            <input 
                                required 
                                type="text"
                                placeholder="e.g. End of Term Assembly"
                                value={newEvent.title || ''} 
                                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input 
                                    required 
                                    type="date"
                                    value={newEvent.event_date || ''} 
                                    onChange={e => setNewEvent({...newEvent, event_date: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Audience</label>
                                <div className="relative">
                                    <select 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                                        value={newEvent.audience}
                                        onChange={e => setNewEvent({...newEvent, audience: e.target.value as any})}
                                    >
                                        <option value="all">Everyone</option>
                                        <option value="students">Students Only</option>
                                        <option value="staff">Staff Only</option>
                                        <option value="parents">Parents</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                            <input 
                                type="text"
                                placeholder="e.g. Main Hall"
                                value={newEvent.location || ''} 
                                onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea 
                                value={newEvent.description || ''} 
                                onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                                rows={3}
                                placeholder="Event details..."
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-70"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Publish Event'}
                        </button>
                    </form>
                </div>
             </div>
        )}
    </div>
  );
};
