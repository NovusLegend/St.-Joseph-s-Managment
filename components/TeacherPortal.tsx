
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { TeacherAllocation, Student, SchoolEvent } from '../types';
import { BookOpen, Save, CheckCircle2, AlertCircle, Loader2, ChevronRight, Calendar, MapPin, Clock, Users } from 'lucide-react';

interface TeacherPortalProps {
  userId: string;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ userId }) => {
  const [allocations, setAllocations] = useState<TeacherAllocation[]>([]);
  const [selectedAllocation, setSelectedAllocation] = useState<TeacherAllocation | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, number>>({}); // Map student_id -> score
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assessmentType, setAssessmentType] = useState('BOT'); // BOT, MOT, EOT
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // New State for Events
  const [events, setEvents] = useState<SchoolEvent[]>([]);

  // Fetch Data (Allocations + Events)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // 1. Fetch Allocations
        // Simulating the join logic for now based on schema
        const { data: allocData } = await supabase
            .from('teacher_allocations')
            .select(`
                id,
                subject_id,
                stream_id,
                subjects (name, code),
                streams (name, class_levels (name))
            `)
            .eq('teacher_id', userId);

        if (allocData) {
            const formatted: TeacherAllocation[] = allocData.map((a: any) => ({
            id: a.id,
            subject_name: a.subjects?.name || 'Unknown Subject',
            subject_code: a.subjects?.code || 'SUB',
            stream_name: a.streams?.name || 'A',
            class_name: a.streams?.class_levels?.name || 'Class',
            }));
            setAllocations(formatted);
        }

        // 2. Fetch Upcoming Events (Audience: All or Staff)
        const today = new Date().toISOString().split('T')[0];
        const { data: eventsData } = await supabase
            .from('school_events')
            .select('*')
            .gte('event_date', today)
            .or('audience.eq.all,audience.eq.staff') // Filter for relevant events
            .order('event_date', { ascending: true })
            .limit(5);

        if (eventsData) setEvents(eventsData as SchoolEvent[]);

      } catch (err) {
          console.error("Error loading teacher data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Fetch Students & Marks when class selected
  useEffect(() => {
    if (!selectedAllocation) return;

    const fetchClassData = async () => {
      setLoading(true);
      setErrorMsg(null);
      
      const { data: studentData } = await supabase.from('students').select('*').limit(30); 
      // ideally filter by stream_id matches here
      
      if (studentData) {
         setStudents(studentData.map((s: any) => ({
             id: s.id,
             full_name: s.full_name,
             student_id_human: s.student_id_human || 'S001'
         })));
      }

      // Get existing marks
      const { data: marksData } = await supabase
        .from('marks')
        .select('*')
        .eq('teacher_allocation_id', selectedAllocation.id)
        .eq('assessment_type', assessmentType);

      const markMap: Record<string, number> = {};
      marksData?.forEach((m: any) => {
          markMap[m.student_id] = m.score;
      });
      setMarks(markMap);
      
      setLoading(false);
    };

    fetchClassData();
  }, [selectedAllocation, assessmentType]);

  const handleScoreChange = (studentId: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
        setMarks(prev => ({...prev, [studentId]: num}));
    } else if (val === '') {
        const newMarks = {...marks};
        delete newMarks[studentId];
        setMarks(newMarks);
    }
  };

  const handleSave = async () => {
    if (!selectedAllocation) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    try {
        const upserts = Object.keys(marks).map(studentId => ({
            student_id: studentId,
            teacher_allocation_id: selectedAllocation.id,
            assessment_type: assessmentType,
            score: marks[studentId],
            updated_at: new Date()
        }));

        for (const entry of upserts) {
            const { data: existing } = await supabase
                .from('marks')
                .select('id')
                .eq('student_id', entry.student_id)
                .eq('teacher_allocation_id', entry.teacher_allocation_id)
                .eq('assessment_type', entry.assessment_type)
                .maybeSingle();
                
            if (existing) {
                const { error: updateErr } = await supabase.from('marks').update({ score: entry.score }).eq('id', existing.id);
                if (updateErr) throw updateErr;
            } else {
                const { error: insertErr } = await supabase.from('marks').insert(entry);
                if (insertErr) throw insertErr;
            }
        }
        setSuccessMsg("Marks saved successfully.");
        setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
        console.error(err);
        setErrorMsg("Failed to save marks. Check your internet connection or permissions.");
    } finally {
        setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  if (loading && !selectedAllocation) {
      return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600"/></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Teacher Portal</h2>
          <p className="text-slate-500 mt-1">Manage your classes and enter assessments.</p>
        </div>
        <div className="bg-white/50 backdrop-blur px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-600 flex items-center gap-2">
           <Calendar size={14} className="text-indigo-600"/>
           Active Session
        </div>
      </div>

      {!selectedAllocation ? (
        // DASHBOARD VIEW (Classes + Events)
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
            
            {/* Main Column: Classes */}
            <div className="lg:col-span-3 space-y-6">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <BookOpen size={20} className="text-indigo-600" />
                    My Classes
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {allocations.length === 0 ? (
                        <div className="col-span-full text-center py-16 bg-white/50 rounded-2xl border border-slate-200 border-dashed">
                            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-medium text-slate-600">No Classes Allocated</h3>
                            <p className="text-slate-400 text-sm">Contact the administrator to be assigned classes.</p>
                        </div>
                    ) : (
                        allocations.map(alloc => (
                            <div 
                                key={alloc.id}
                                onClick={() => setSelectedAllocation(alloc)}
                                className="glass-card p-6 rounded-2xl hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden border-t-4 border-t-indigo-500"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <BookOpen size={80} />
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase border border-indigo-100">
                                        {alloc.subject_code}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-1">{alloc.class_name} {alloc.stream_name}</h3>
                                <p className="text-slate-500 font-medium">{alloc.subject_name}</p>
                                
                                <div className="mt-6 flex items-center gap-2 text-sm text-indigo-600 font-medium group-hover:translate-x-1 transition-transform">
                                    Open Gradebook <ChevronRight size={16} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Sidebar Column: Events */}
            <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <Calendar size={20} className="text-pink-600" />
                    Upcoming Events
                </h3>

                <div className="space-y-4">
                    {events.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-sm">No upcoming events.</p>
                        </div>
                    ) : (
                        events.map(evt => (
                            <div key={evt.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500"></div>
                                <div className="pl-3">
                                    <p className="text-xs font-bold text-pink-600 mb-1">{formatDate(evt.event_date)}</p>
                                    <h4 className="font-bold text-slate-800 text-sm leading-tight mb-2">{evt.title}</h4>
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <Clock size={12} />
                                        <span>All Day</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                        <MapPin size={12} />
                                        <span className="truncate">{evt.location}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      ) : (
        // GRADING VIEW
        <div className="space-y-6">
            <button 
                onClick={() => setSelectedAllocation(null)}
                className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors group"
            >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
            </button>

            <div className="glass-card rounded-2xl p-6 border-l-4 border-l-indigo-600 flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">{selectedAllocation.class_name} {selectedAllocation.stream_name}</h3>
                    <p className="text-slate-500 flex items-center gap-2 mt-1">
                        <BookOpen size={16} /> {selectedAllocation.subject_name}
                    </p>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-4">
                     <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        {['BOT', 'MOT', 'EOT'].map(type => (
                            <button
                                key={type}
                                onClick={() => setAssessmentType(type)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    assessmentType === type 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                     </div>
                     <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-70"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />}
                        Save Marks
                    </button>
                </div>
            </div>

            {errorMsg && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 border border-red-100 animate-fade-in">
                    <AlertCircle size={20} />
                    {errorMsg}
                </div>
            )}
            
            {successMsg && (
                <div className="bg-green-50 text-green-600 p-4 rounded-xl flex items-center gap-2 border border-green-100 animate-fade-in">
                    <CheckCircle2 size={20} />
                    {successMsg}
                </div>
            )}

            <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-left">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-center">Score</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-center">Grade</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {students.map((student) => {
                                const score = marks[student.id];
                                let grade = '-';
                                let gradeColor = 'text-slate-300';
                                
                                if (score !== undefined) {
                                    if (score >= 80) { grade = 'A'; gradeColor = 'text-green-600'; }
                                    else if (score >= 70) { grade = 'B'; gradeColor = 'text-indigo-600'; }
                                    else if (score >= 60) { grade = 'C'; gradeColor = 'text-yellow-600'; }
                                    else if (score >= 50) { grade = 'D'; gradeColor = 'text-orange-600'; }
                                    else { grade = 'F'; gradeColor = 'text-red-600'; }
                                }

                                return (
                                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 text-sm font-mono text-slate-400 group-hover:text-slate-600">{student.student_id_human}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{student.full_name}</td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={score ?? ''}
                                            onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                            className="w-full text-center font-mono text-lg border border-slate-200 rounded-lg py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                            placeholder="-"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-lg font-bold ${gradeColor}`}>{grade}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="text"
                                            className="w-full text-sm border-b border-transparent hover:border-slate-300 focus:border-indigo-500 bg-transparent py-1 outline-none transition-colors text-slate-600 placeholder-slate-300"
                                            placeholder="Add comment..."
                                        />
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
                {students.length === 0 && !loading && (
                    <div className="p-20 text-center text-slate-400 bg-white">
                        <Users size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No students enrolled in this class yet.</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
