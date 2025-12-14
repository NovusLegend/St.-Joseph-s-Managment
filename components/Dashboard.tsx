
import React, { useEffect, useState } from 'react';
import { Users, AlertCircle, Calendar, GraduationCap, Loader2, MapPin } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { SchoolEvent, AcademicYear, Term } from '../types';

export const Dashboard: React.FC = () => {
  const [upcomingEvent, setUpcomingEvent] = useState<SchoolEvent | null>(null);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [currentTerm, setCurrentTerm] = useState<Term | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Upcoming Event
        const today = new Date().toISOString();
        const { data: eventData } = await supabase
          .from('school_events')
          .select('*')
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (eventData) setUpcomingEvent(eventData as SchoolEvent);

        // 2. Fetch Active Academic Year
        const { data: yearData } = await supabase
          .from('academic_years')
          .select('*')
          .eq('is_current', true)
          .maybeSingle();
        
        if (yearData) setCurrentYear(yearData as AcademicYear);

        // 3. Fetch Active Term
        const { data: termData } = await supabase
          .from('terms')
          .select('*')
          .eq('is_current', true)
          .maybeSingle();
          
        if (termData) setCurrentTerm(termData as Term);

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const calculateWeek = (startDate?: string) => {
      if (!startDate) return 1;
      const start = new Date(startDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      // If start date is in future
      if (start > now) return 'Upcoming';
      
      return Math.ceil(diffDays / 7);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl flex flex-col relative overflow-hidden group bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl shadow-indigo-500/20">
          <h3 className="text-sm font-medium text-indigo-200 mb-4">Academic Status</h3>
          <div className="mt-auto">
             {loading ? (
                 <div className="space-y-2 animate-pulse">
                     <div className="h-8 w-24 bg-white/20 rounded"></div>
                     <div className="h-4 w-16 bg-white/10 rounded"></div>
                 </div>
             ) : (
                 <>
                    <span className="text-3xl font-bold">
                        {currentTerm ? currentTerm.name : 'No Active Term'}
                    </span>
                    <p className="text-xs text-indigo-200 mt-1 font-medium">
                        {currentYear?.name || 'Year Not Set'} • {currentTerm ? `Week ${calculateWeek(currentTerm.start_date)}` : 'Break'}
                    </p>
                 </>
             )}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col">
          <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-slate-500">Upcoming Event</h3>
              <Calendar size={20} className="text-indigo-400" />
          </div>
          <div className="mt-auto">
             {loading ? (
                <div className="animate-pulse flex flex-col gap-2">
                    <div className="h-6 w-32 bg-slate-200 rounded"></div>
                    <div className="h-4 w-24 bg-slate-100 rounded"></div>
                </div>
             ) : upcomingEvent ? (
                <>
                    <span className="text-xl font-bold text-slate-800 line-clamp-1" title={upcomingEvent.title}>
                        {upcomingEvent.title}
                    </span>
                    <div className="flex flex-col gap-0.5 mt-1">
                        <p className="text-xs text-indigo-600 font-medium">
                            {formatDate(upcomingEvent.event_date)}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                            <MapPin size={10} /> {upcomingEvent.location}
                        </p>
                    </div>
                </>
             ) : (
                <>
                    <span className="text-xl font-bold text-slate-800">No Events</span>
                    <p className="text-xs text-slate-500 font-medium mt-1">Calendar is clear</p>
                </>
             )}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col">
          <div className="flex justify-between items-start">
             <h3 className="text-sm font-medium text-slate-500">Admissions</h3>
             <Users size={20} className="text-indigo-400" />
          </div>
          <div className="mt-auto">
             <span className="text-2xl font-bold text-slate-800">Open</span>
             <p className="text-xs text-slate-500 font-medium mt-1">S1 & S5 Intake</p>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="glass-card p-0 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">System Alerts</h3>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[400px] p-6 space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Marks Missing</p>
                <p className="text-xs text-slate-500 mt-1">Senior 3 Physics (South)</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Users size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Staff Meeting</p>
                <p className="text-xs text-slate-500 mt-1">Main Hall, 4:00 PM</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 flex-shrink-0">
                <GraduationCap size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">New Allocations</p>
                <p className="text-xs text-slate-500 mt-1">Schedule Updated for {currentTerm?.name || 'Next Term'}</p>
              </div>
            </div>
        </div>
        <div className="p-4 bg-slate-50/50 mt-auto border-t border-slate-100">
            <button className="w-full text-center text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-indigo-600 transition-colors">
              View All Alerts
            </button>
        </div>
      </div>
    </div>
  );
};
