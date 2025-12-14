
import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, BarChart3, Plus, X, Loader2, CheckCircle2, ChevronDown, Database, AlertCircle, BookOpen, Calendar, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { UserProfile, Subject, ClassLevel, Stream, TeacherAllocation, AcademicYear, Term } from '../types';

export const AdminAcademics: React.FC = () => {
  // Data States
  const [allocations, setAllocations] = useState<TeacherAllocation[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  
  // Session States
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [currentTerm, setCurrentTerm] = useState<Term | null>(null);

  // UI States
  const [loading, setLoading] = useState(true);
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Allocation Form States
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStream, setSelectedStream] = useState('');

  // Session Form States
  const [newYearName, setNewYearName] = useState('');
  const [newYearStart, setNewYearStart] = useState('');
  const [newYearEnd, setNewYearEnd] = useState('');
  const [newTermName, setNewTermName] = useState('Term 1');
  const [newTermStart, setNewTermStart] = useState('');
  const [newTermEnd, setNewTermEnd] = useState('');

  // Computed
  const availableStreams = allStreams.filter(s => s.class_id === selectedClass);

  // Helper to format errors safely
  const formatError = (err: any): string => {
      if (!err) return "Unknown error occurred.";
      if (typeof err === 'string') return err;
      if (err instanceof Error) return err.message;
      if (typeof err === 'object') {
          const parts = [];
          if (err.message) parts.push(err.message);
          if (err.details) parts.push(`(${err.details})`);
          if (parts.length > 0) return parts.join(' ');
      }
      return "Operation failed. Check permissions or network.";
  };

  const fetchData = async () => {
    setLoading(true);
    
    try {
        const [
            teachersRes, 
            subjectsRes, 
            classesRes, 
            streamsRes, 
            yearsRes,
            allocRes
        ] = await Promise.all([
            supabase.from('profiles').select('*').eq('role', 'teacher'),
            supabase.from('subjects').select('*').order('name'),
            supabase.from('class_levels').select('*').order('level'),
            supabase.from('streams').select('*').order('name'),
            supabase.from('academic_years').select('*').order('start_date', { ascending: false }),
            supabase.from('teacher_allocations').select(`
                id,
                teacher_id,
                profiles:teacher_id(full_name),
                subjects(name, code),
                streams(name, class_levels(name))
            `).order('created_at', { ascending: false }).limit(20)
        ]);

        if (teachersRes.data) setTeachers(teachersRes.data as UserProfile[]);
        if (subjectsRes.data) setSubjects(subjectsRes.data as Subject[]);
        if (classesRes.data) setClassLevels(classesRes.data as ClassLevel[]);
        if (streamsRes.data) setAllStreams(streamsRes.data as Stream[]);
        if (yearsRes.data) setAcademicYears(yearsRes.data as AcademicYear[]);

        // Determine Active Year
        const activeY = yearsRes.data?.find((y: any) => y.is_current) || yearsRes.data?.[0];
        setCurrentYear(activeY || null);

        // Fetch Terms for Active Year
        if (activeY) {
            const { data: termsData } = await supabase
                .from('terms')
                .select('*')
                .eq('academic_year_id', activeY.id)
                .order('start_date');
            if (termsData) {
                setTerms(termsData as Term[]);
                setCurrentTerm(termsData.find((t: any) => t.is_current) || null);
            }
        }

        if (allocRes.data) {
            const formatted = allocRes.data.map((a: any) => ({
                id: a.id,
                teacher_name: a.profiles?.full_name || 'Unknown',
                subject_name: a.subjects?.name || 'Unknown',
                subject_code: a.subjects?.code || '',
                stream_name: a.streams?.name || '',
                class_name: a.streams?.class_levels?.name || ''
            })) as TeacherAllocation[];
            setAllocations(formatted);
        }
    } catch (err) {
        console.error("Error fetching academic data:", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ALLOCATION LOGIC ---

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    
    if (!currentYear) {
        setErrorMsg("System Error: No active Academic Year. Use 'Calendar Settings' to create one.");
        return;
    }

    setSubmitting(true);
    try {
        const { error } = await supabase.from('teacher_allocations').insert({
            teacher_id: selectedTeacher,
            subject_id: selectedSubject,
            stream_id: selectedStream,
            academic_year_id: currentYear.id
        });

        if (error) {
             if (error.code === '42501') throw new Error("Permission Denied: Run SQL.txt script to fix RLS.");
             throw error;
        }

        setSuccessMsg("Teacher successfully assigned.");
        fetchData();
        setTimeout(() => {
            setSuccessMsg(null);
            setIsAllocModalOpen(false);
        }, 1500);
    } catch (err: any) {
        setErrorMsg(formatError(err));
    } finally {
        setSubmitting(false);
    }
  };

  // --- SESSION / CALENDAR LOGIC ---

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newYearName || !newYearStart || !newYearEnd) {
        setErrorMsg("Please fill in all fields (Name, Start Date, End Date).");
        return;
    }

    if (new Date(newYearStart) > new Date(newYearEnd)) {
        setErrorMsg("Start Date cannot be after End Date.");
        return;
    }

    setSubmitting(true);
    try {
        // Safe Update: Set all others to false first.
        // Note: If you have the SQL trigger from SQL.txt installed, the DB handles this automatically.
        // We do this here as a fallback for the frontend.
        await supabase.from('academic_years').update({ is_current: false }).gt('created_at', '2000-01-01');

        const { error } = await supabase.from('academic_years').insert({
            name: newYearName,
            start_date: newYearStart,
            end_date: newYearEnd,
            is_current: true
        });
        if (error) throw error;
        
        await fetchData();
        setNewYearName('');
        setNewYearStart('');
        setNewYearEnd('');
        setSuccessMsg("New Academic Year Created & Activated!");
    } catch (err) {
        setErrorMsg(formatError(err));
    } finally {
        setSubmitting(false);
    }
  };

  const handleActivateYear = async (yearId: string) => {
    if (!confirm("Are you sure you want to change the active Academic Year? This will affect all current operations.")) return;
    
    setLoading(true);
    try {
        // 1. Deactivate all
        await supabase.from('academic_years').update({ is_current: false }).gt('created_at', '2000-01-01');
        // 2. Activate one
        const { error } = await supabase.from('academic_years').update({ is_current: true }).eq('id', yearId);
        if (error) throw error;
        await fetchData();
        setSuccessMsg("Academic Year Switched Successfully.");
        setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
        alert(formatError(err));
    } finally {
        setLoading(false);
    }
  };

  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentYear) return;
    
    if (!newTermStart || !newTermEnd) {
        setErrorMsg("Please select start and end dates for the term.");
        return;
    }

    setSubmitting(true);
    try {
        await supabase.from('terms').update({ is_current: false }).eq('academic_year_id', currentYear.id);

        const { error } = await supabase.from('terms').insert({
            academic_year_id: currentYear.id,
            name: newTermName,
            start_date: newTermStart,
            end_date: newTermEnd,
            is_current: true
        });
        if (error) throw error;
        
        await fetchData();
        setSuccessMsg("Term Created & Activated!");
    } catch (err) {
        setErrorMsg(formatError(err));
    } finally {
        setSubmitting(false);
    }
  };

  const handleActivateTerm = async (termId: string) => {
      if(!currentYear) return;
      setLoading(true);
      try {
          await supabase.from('terms').update({ is_current: false }).eq('academic_year_id', currentYear.id);
          const { error } = await supabase.from('terms').update({ is_current: true }).eq('id', termId);
          if (error) throw error;
          await fetchData();
      } catch(err) {
          alert(formatError(err));
      } finally {
          setLoading(false);
      }
  }

  // --- SEEDING LOGIC ---

  const handleSeedStreams = async () => {
    if (!confirm("Generate streams (North, Central, South, East, West) for S1-S4?")) return;
    setLoading(true);
    try {
        const { data: levels } = await supabase.from('class_levels').select('id, level').gte('level', 1).lte('level', 4);
        if (!levels?.length) throw new Error("Levels S1-S4 missing.");
        
        const { data: existing } = await supabase.from('streams').select('class_id, name');
        const target = ['North', 'Central', 'South', 'East', 'West'];
        const payload: any[] = [];

        levels.forEach(lvl => {
            target.forEach(name => {
                if (!existing?.some(e => e.class_id === lvl.id && e.name === name)) {
                    payload.push({ class_id: lvl.id, name });
                }
            });
        });

        if (payload.length > 0) await supabase.from('streams').insert(payload);
        setSuccessMsg(payload.length > 0 ? `Created ${payload.length} streams.` : "Streams already exist.");
        setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
        alert(formatError(err));
    } finally {
        setLoading(false);
    }
  };

  const handleSeedSubjects = async () => {
      if (!confirm("Add missing subjects?")) return;
      setLoading(true);
      const subjectsList = ["Biology", "Physics", "Chemistry", "ICT", "Mathematics", "English", "Geography", "Kiswahili", "Fine Art", "CRE", "Luganda", "Entrepreneurship", "Performing Arts", "Moral Training", "History", "Agriculture", "Physical Education", "Literature", "Economics"];
      
      try {
          const { data: existing } = await supabase.from('subjects').select('name');
          const existingSet = new Set(existing?.map(s => s.name));
          const payload = subjectsList
            .filter(n => !existingSet.has(n))
            .map(n => ({ name: n, code: n.substring(0,3).toUpperCase(), level: 'O-Level' }));
          
          if (payload.length > 0) await supabase.from('subjects').insert(payload);
          setSuccessMsg(payload.length > 0 ? `Added ${payload.length} subjects.` : "Subjects up to date.");
          fetchData();
          setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: any) {
          alert(formatError(err));
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
        
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Academic Administration</h2>
                <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm">
                    <Calendar size={14} className="text-indigo-600"/>
                    <span className="font-semibold text-slate-700">Current Session:</span>
                    {currentYear ? (
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-medium">
                            {currentYear.name} {currentTerm ? `— ${currentTerm.name}` : '(No Active Term)'}
                        </span>
                    ) : (
                        <span className="text-red-500 font-bold bg-red-50 px-2 rounded">Not Set</span>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <button 
                    onClick={() => setIsSessionModalOpen(true)}
                    className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-50 transition-all text-sm"
                >
                    <Clock size={16} />
                    Calendar Settings
                </button>
                <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                <button onClick={handleSeedSubjects} className="btn-secondary text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Seed Subjects</button>
                <button onClick={handleSeedStreams} className="btn-secondary text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Seed Streams</button>
                <button 
                    onClick={() => setIsAllocModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 text-sm"
                >
                    <Plus size={18} />
                    New Allocation
                </button>
            </div>
        </div>

        {/* Global Success Msg */}
        {successMsg && !isAllocModalOpen && !isSessionModalOpen && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border border-green-100">
                <CheckCircle2 size={24} />
                <span className="font-medium">{successMsg}</span>
            </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Teachers</p>
                        <h3 className="text-2xl font-bold text-slate-800">{teachers.length}</h3>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-blue-500 w-[80%] h-full"></div></div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-violet-100 text-violet-600 rounded-xl"><GraduationCap size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Allocations</p>
                        <h3 className="text-2xl font-bold text-slate-800">{allocations.length}</h3>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-violet-500 w-[100%] h-full"></div></div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><BarChart3 size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Classes</p>
                        <h3 className="text-2xl font-bold text-slate-800">{classLevels.length}</h3>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 w-[100%] h-full"></div></div>
            </div>
        </div>

        {/* Allocation List */}
        <div className="glass-card rounded-2xl overflow-hidden p-6 min-h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Staff Allocations ({currentTerm ? currentTerm.name : 'No Term'})</h3>
            {loading ? (
                <div className="flex justify-center h-40 items-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
            ) : allocations.length === 0 ? (
                <div className="text-center text-slate-500 py-12"><GraduationCap size={48} className="mx-auto mb-3 opacity-50"/><p>No allocations found for this session.</p></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase">Teacher</th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase">Subject</th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase">Class</th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase">Stream</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {allocations.map((alloc) => (
                                <tr key={alloc.id} className="hover:bg-slate-50/50">
                                    <td className="py-4 font-medium text-slate-700">{alloc.teacher_name}</td>
                                    <td className="py-4 text-slate-600"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold mr-2">{alloc.subject_code}</span>{alloc.subject_name}</td>
                                    <td className="py-4 text-slate-600">{alloc.class_name}</td>
                                    <td className="py-4"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{alloc.stream_name}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* --- ALLOCATION MODAL --- */}
        {isAllocModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAllocModalOpen(false)}></div>
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="text-xl font-bold text-slate-900">Assign Teacher</h3>
                        <button onClick={() => setIsAllocModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                    </div>
                    <form onSubmit={handleAllocate} className="p-6 space-y-5">
                         {errorMsg && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100 flex gap-2"><AlertCircle size={16} className="shrink-0 mt-0.5" />{errorMsg}</div>}
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
                            <div className="relative">
                                <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} required className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 outline-none appearance-none bg-white">
                                    <option value="">Select Staff...</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                <div className="relative">
                                    <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} required className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 outline-none appearance-none bg-white">
                                        <option value="">Select Subject...</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                                <div className="relative">
                                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} required className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 outline-none appearance-none bg-white">
                                        <option value="">Select Class...</option>
                                        {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Stream</label>
                                <div className="relative">
                                    <select value={selectedStream} onChange={(e) => setSelectedStream(e.target.value)} required disabled={!selectedClass} className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 outline-none appearance-none bg-white disabled:bg-slate-100">
                                        <option value="">{availableStreams.length ? 'Select...' : 'None'}</option>
                                        {availableStreams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                             </div>
                         </div>
                         <button type="submit" disabled={submitting} className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 flex justify-center gap-2 items-center hover:bg-slate-800 disabled:opacity-70">
                            {submitting ? <Loader2 className="animate-spin" /> : 'Confirm Assignment'}
                         </button>
                    </form>
                </div>
            </div>
        )}

        {/* --- SESSION MANAGEMENT MODAL --- */}
        {isSessionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSessionModalOpen(false)}></div>
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Academic Calendar</h3>
                            <p className="text-sm text-indigo-600">Configure academic years and school terms.</p>
                        </div>
                        <button onClick={() => setIsSessionModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* 1. Academic Year Section */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Academic Year Management</h4>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left: Create New Year */}
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                    <h5 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <Plus size={16} className="text-indigo-600"/> Create New Year
                                    </h5>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Year Name</label>
                                            <input 
                                                placeholder="e.g. 2025" 
                                                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={newYearName}
                                                onChange={e => setNewYearName(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 mb-1 block">Start Date</label>
                                                <input type="date" className="w-full p-2 text-sm border border-slate-300 rounded-lg" value={newYearStart} onChange={e => setNewYearStart(e.target.value)}/>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 mb-1 block">End Date</label>
                                                <input type="date" className="w-full p-2 text-sm border border-slate-300 rounded-lg" value={newYearEnd} onChange={e => setNewYearEnd(e.target.value)}/>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleCreateYear}
                                            disabled={submitting}
                                            className="w-full bg-slate-900 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                                        >
                                            {submitting ? <Loader2 size={14} className="animate-spin"/> : 'Create & Set Active'}
                                        </button>
                                        <p className="text-[10px] text-slate-400 text-center">Creating a year automatically sets it as active.</p>
                                    </div>
                                </div>

                                {/* Right: Existing Years */}
                                <div className="lg:col-span-2 space-y-3">
                                    <h5 className="text-sm font-bold text-slate-500">Existing Years</h5>
                                    <div className="flex gap-4 overflow-x-auto pb-4">
                                        {academicYears.map(year => (
                                            <div 
                                                key={year.id} 
                                                className={`flex-shrink-0 p-4 rounded-xl border min-w-[160px] transition-all relative group ${year.is_current ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-100' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${year.is_current ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {year.is_current ? 'ACTIVE' : 'INACTIVE'}
                                                    </span>
                                                </div>
                                                <div className="mt-2 text-xl font-bold text-slate-800">{year.name}</div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {year.start_date ? new Date(year.start_date).getFullYear() : 'N/A'} - {year.end_date ? new Date(year.end_date).getFullYear() : 'N/A'}
                                                </div>
                                                {!year.is_current && (
                                                    <button 
                                                        onClick={() => handleActivateYear(year.id)}
                                                        className="mt-3 w-full py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                                                    >
                                                        Set Active
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Term Section (Only if year exists) */}
                        {currentYear && (
                             <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex justify-between items-center">
                                    <span>Terms for {currentYear.name}</span>
                                    {currentTerm && <span className="text-indigo-600 normal-case bg-indigo-50 px-2 rounded text-xs py-1 border border-indigo-100 font-medium">Current: {currentTerm.name}</span>}
                                </h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <h5 className="text-sm font-bold text-slate-500">Term List</h5>
                                        {terms.length === 0 && <p className="text-sm text-slate-400 italic">No terms created yet.</p>}
                                        {terms.map(term => (
                                            <div key={term.id} className={`flex items-center justify-between p-3 border rounded-lg ${term.is_current ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
                                                <div>
                                                    <span className={`font-bold ${term.is_current ? 'text-green-800' : 'text-slate-700'}`}>{term.name}</span>
                                                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {term.start_date} <ArrowRight size={10} /> {term.end_date}
                                                    </div>
                                                </div>
                                                {term.is_current ? (
                                                    <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm"><CheckCircle2 size={12}/> Active</span>
                                                ) : (
                                                    <button onClick={() => handleActivateTerm(term.id)} className="text-xs text-indigo-600 font-medium hover:bg-indigo-50 px-2 py-1 rounded transition-colors">Activate</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* New Term Creator */}
                                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 h-fit">
                                        <h5 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <Plus size={16} className="text-indigo-600"/> Add Term
                                        </h5>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 mb-1 block">Term Name</label>
                                                <select value={newTermName} onChange={e => setNewTermName(e.target.value)} className="w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-white">
                                                    <option>Term 1</option>
                                                    <option>Term 2</option>
                                                    <option>Term 3</option>
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Start Date</label>
                                                    <input type="date" className="w-full p-2 text-sm border border-slate-300 rounded-lg" value={newTermStart} onChange={e => setNewTermStart(e.target.value)}/>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 mb-1 block">End Date</label>
                                                    <input type="date" className="w-full p-2 text-sm border border-slate-300 rounded-lg" value={newTermEnd} onChange={e => setNewTermEnd(e.target.value)}/>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleCreateTerm}
                                                disabled={submitting}
                                                className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 mt-2"
                                            >
                                                {submitting ? 'Processing...' : 'Add Term'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        )}
                        
                        {errorMsg && <div className="text-red-600 text-sm font-medium text-center bg-red-50 p-2 rounded-lg border border-red-100">{errorMsg}</div>}
                        {successMsg && <div className="text-green-600 text-sm font-medium text-center bg-green-50 p-2 rounded-lg border border-green-100">{successMsg}</div>}
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};
