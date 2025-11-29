
import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, BarChart3, Plus, X, Loader2, CheckCircle2, ChevronDown, Database, AlertCircle, BookOpen } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { UserProfile, Subject, ClassLevel, Stream, TeacherAllocation } from '../types';

export const AdminAcademics: React.FC = () => {
  // Data States
  const [allocations, setAllocations] = useState<TeacherAllocation[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [currentYearId, setCurrentYearId] = useState<string | null>(null);

  // UI States
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form States
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStream, setSelectedStream] = useState('');

  // Computed: Filter streams based on selected class
  const availableStreams = allStreams.filter(s => s.class_id === selectedClass);

  // Helper to format errors safely
  const formatError = (err: any): string => {
      if (!err) return "Unknown error occurred.";
      if (typeof err === 'string') return err;
      
      // Handle Supabase/Postgrest Error Objects
      if (typeof err === 'object') {
          // Combine message and details if available
          const parts = [];
          if (err.message) parts.push(err.message);
          if (err.details) parts.push(`(${err.details})`);
          if (err.hint) parts.push(`Hint: ${err.hint}`);
          
          if (parts.length > 0) return parts.join(' ');
          
          if (err.error_description) return err.error_description;
      }

      // Last resort: Stringify
      try {
          return JSON.stringify(err);
      } catch (e) {
          return "Unreadable error format.";
      }
  };

  const fetchData = async () => {
    setLoading(true);
    
    try {
        // 1. Fetch Reference Data Parallel
        const [
            teachersRes, 
            subjectsRes, 
            classesRes, 
            streamsRes, 
            yearRes,
            allocRes
        ] = await Promise.all([
            supabase.from('profiles').select('*').eq('role', 'teacher'),
            supabase.from('subjects').select('*').order('name'),
            supabase.from('class_levels').select('*').order('level'),
            supabase.from('streams').select('*').order('name'),
            supabase.from('academic_years').select('id').eq('is_current', true).maybeSingle(),
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
        
        // Handle Academic Year Logic
        if (yearRes.data) {
            setCurrentYearId(yearRes.data.id);
        } else {
            console.log("No current academic year found. Attempting to recover...");
            // Fallback 1: Try to find ANY year
            const { data: anyYear } = await supabase.from('academic_years').select('id').limit(1).maybeSingle();
            if (anyYear) {
                setCurrentYearId(anyYear.id);
            } else {
                // Fallback 2: Create a default year
                const currentYearName = new Date().getFullYear().toString();
                console.log(`Creating default academic year: ${currentYearName}`);
                const { data: newYear, error: yearError } = await supabase
                    .from('academic_years')
                    .insert({ name: currentYearName, is_current: true })
                    .select()
                    .single();
                
                if (newYear) {
                    setCurrentYearId(newYear.id);
                } else if (yearError) {
                    console.error("Failed to create academic year:", yearError);
                }
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

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    
    if (!currentYearId) {
        setErrorMsg("System Error: No active Academic Year found. Please check database configuration.");
        return;
    }

    if (!selectedTeacher || !selectedSubject || !selectedStream) {
        setErrorMsg("Please complete all fields (Teacher, Subject, Class, and Stream).");
        return;
    }

    setSubmitting(true);
    
    try {
        const payload = {
            teacher_id: selectedTeacher,
            subject_id: selectedSubject,
            stream_id: selectedStream,
            academic_year_id: currentYearId
        };
        
        const { error } = await supabase.from('teacher_allocations').insert(payload);

        if (error) {
            console.error("Allocation DB Error:", error);
            // Check for RLS policy error specifically
            if (error.code === '42501') {
                setErrorMsg("Permission Denied: Run the commands in 'database_updates.sql' to fix Row Level Security.");
            } else {
                setErrorMsg(`Database Error: ${formatError(error)}`);
            }
        } else {
            setSuccessMsg("Teacher successfully assigned to class.");
            // Reset form
            setSelectedTeacher('');
            setSelectedSubject('');
            setSelectedClass('');
            setSelectedStream('');
            // Refresh list
            fetchData(); 
            // Close modal after brief delay
            setTimeout(() => {
                setSuccessMsg(null);
                setIsModalOpen(false);
            }, 2000);
        }
    } catch (err: any) {
        setErrorMsg(`Unexpected error: ${formatError(err)}`);
    } finally {
        setSubmitting(false);
    }
  };

  const handleSeedStreams = async () => {
    if (!confirm("Generate streams (North, Central, South, East, West) for Senior 1-4?")) return;
    setLoading(true);
    setErrorMsg(null);

    try {
        // Fetch Levels 1-4 (S1-S4)
        const { data: levels } = await supabase
            .from('class_levels')
            .select('id, name, level')
            .gte('level', 1)
            .lte('level', 4);

        if (!levels?.length) throw new Error("Class levels S1-S4 not found. Please populate class_levels table first.");

        // Fetch EXISTING streams to avoid duplicates
        const { data: existingStreams } = await supabase.from('streams').select('class_id, name');

        const targetStreams = ['North', 'Central', 'South', 'East', 'West'];
        const payload: any[] = [];

        levels.forEach(level => {
            targetStreams.forEach(name => {
                // Check if this stream exists for this class
                const alreadyExists = existingStreams?.some(
                    es => es.class_id === level.id && es.name === name
                );

                if (!alreadyExists) {
                    payload.push({ class_id: level.id, name });
                }
            });
        });

        if (payload.length === 0) {
            setSuccessMsg("All streams for S1-S4 already exist.");
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            const { error } = await supabase.from('streams').insert(payload);
            if (error) {
                 if (error.code === '42501') {
                     throw new Error("Permission Denied: You need Admin RLS policies. Check 'SQL.txt'.");
                 }
                 throw error;
            }
            setSuccessMsg(`Successfully created ${payload.length} new streams.`);
            fetchData(); // Refresh streams
            setTimeout(() => setSuccessMsg(null), 3000);
        }
    } catch (err: any) {
        const msg = formatError(err);
        alert(`Failed to seed streams: ${msg}`);
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleSeedSubjects = async () => {
    if (!confirm("Add missing subjects (Biology, Physics, Chemistry, etc.) to the database?")) return;
    setLoading(true);
    setSuccessMsg(null);

    const subjectsList = [
        "Biology", "Physics", "Chemistry", "ICT", "Mathematics", "English", 
        "Geography", "Kiswahili", "Fine Art", "CRE", "Luganda", 
        "Entrepreneurship", "Performing Arts", "Moral Training", "History", 
        "Agriculture", "Physical Education", "Literature", "Economics"
    ];

    try {
        // Fetch existing subjects to filter duplicates
        const { data: existing } = await supabase.from('subjects').select('name');
        const existingNames = new Set(existing?.map(s => s.name.toLowerCase()));

        const payload = subjectsList
            .filter(name => !existingNames.has(name.toLowerCase()))
            .map(name => ({
                name,
                code: name.substring(0, 3).toUpperCase(),
                level: 'O-Level' // Default
            }));

        if (payload.length > 0) {
            const { error } = await supabase.from('subjects').insert(payload);
            if (error) throw error;
            setSuccessMsg(`Added ${payload.length} new subjects.`);
            fetchData();
        } else {
            setSuccessMsg("All subjects already exist.");
        }
         setTimeout(() => setSuccessMsg(null), 3000);

    } catch (err: any) {
         alert(`Failed to seed subjects: ${formatError(err)}`);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Academic Administration</h2>
            <p className="text-slate-500 mt-1">Oversee class allocations, subject performance, and staff distribution.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
                <button 
                    onClick={handleSeedSubjects}
                    className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-3 py-2.5 rounded-xl font-medium shadow-sm hover:bg-slate-50 transition-all text-sm"
                    title="Add default subjects"
                >
                    <BookOpen size={16} />
                    <span>Seed Subjects</span>
                </button>
                 <button 
                    onClick={handleSeedStreams}
                    className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-3 py-2.5 rounded-xl font-medium shadow-sm hover:bg-slate-50 transition-all text-sm"
                    title="Generate default streams for S1-S4"
                >
                    <Database size={16} />
                    <span>Seed Streams</span>
                </button>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 text-sm"
                >
                    <Plus size={18} />
                    New Allocation
                </button>
            </div>
        </div>

        {/* Success Banner (Global) */}
        {successMsg && !isModalOpen && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 animate-fade-in border border-green-100">
                <CheckCircle2 size={24} />
                <span className="font-medium">{successMsg}</span>
            </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Teachers</p>
                        <h3 className="text-2xl font-bold text-slate-800">{teachers.length}</h3>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 w-[80%] h-full"></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Active Staff Members</p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
                        <GraduationCap size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Allocations</p>
                        <h3 className="text-2xl font-bold text-slate-800">{allocations.length}</h3>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-violet-500 w-[100%] h-full"></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">This Term</p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Classes</p>
                        <h3 className="text-2xl font-bold text-slate-800">{classLevels.length}</h3>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 w-[100%] h-full"></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Active Class Levels</p>
            </div>
        </div>

        {/* Allocation List */}
        <div className="glass-card rounded-2xl overflow-hidden p-6 min-h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Teacher Allocations</h3>
            
            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                </div>
            ) : allocations.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                    <GraduationCap size={48} className="mx-auto mb-3 text-slate-300"/>
                    <p>No allocations found. Create one to get started.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase">Teacher</th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase">Subject</th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase">Class</th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase">Stream</th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {allocations.map((alloc) => (
                                <tr key={alloc.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 font-medium text-slate-700">{alloc.teacher_name}</td>
                                    <td className="py-4 text-slate-600">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold mr-2">
                                            {alloc.subject_code}
                                        </span>
                                        {alloc.subject_name}
                                    </td>
                                    <td className="py-4 text-slate-600">{alloc.class_name}</td>
                                    <td className="py-4">
                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">
                                            {alloc.stream_name}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <button className="text-indigo-600 text-sm font-medium hover:underline">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div 
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                    onClick={() => setIsModalOpen(false)}
                ></div>
                
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h3 className="text-xl font-bold text-slate-900">Assign Teacher</h3>
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleAllocate} className="p-6 space-y-5">
                         {/* In-Modal Feedback */}
                         {successMsg && (
                            <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-3 text-sm border border-green-100">
                                <CheckCircle2 size={18} />
                                <span className="font-medium">{successMsg}</span>
                            </div>
                         )}
                         {errorMsg && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-3 text-sm border border-red-100">
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <span className="font-medium break-words w-full">{errorMsg}</span>
                            </div>
                         )}

                         {!successMsg && (
                             <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
                                    <div className="relative">
                                        <select
                                            value={selectedTeacher}
                                            onChange={(e) => setSelectedTeacher(e.target.value)}
                                            required
                                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none bg-slate-50"
                                        >
                                            <option value="">Select a staff member...</option>
                                            {teachers.map(t => (
                                                <option key={t.id} value={t.id}>{t.full_name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                    <div className="relative">
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            required
                                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none bg-slate-50"
                                        >
                                            <option value="">Select subject...</option>
                                            {subjects.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                                        <div className="relative">
                                            <select
                                                value={selectedClass}
                                                onChange={(e) => setSelectedClass(e.target.value)}
                                                required
                                                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none bg-slate-50"
                                            >
                                                <option value="">Select Class...</option>
                                                {classLevels.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Stream</label>
                                        <div className="relative">
                                            <select
                                                value={selectedStream}
                                                onChange={(e) => setSelectedStream(e.target.value)}
                                                required
                                                disabled={!selectedClass}
                                                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
                                            >
                                                <option value="">
                                                    {availableStreams.length > 0 ? 'Select Stream...' : 'No Streams Found'}
                                                </option>
                                                {availableStreams.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                        </div>
                                        {selectedClass && availableStreams.length === 0 && (
                                            <button 
                                                type="button" 
                                                onClick={handleSeedStreams}
                                                className="text-xs text-indigo-600 mt-1 font-medium hover:underline"
                                            >
                                                Fix Missing Streams
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {submitting ? <Loader2 className="animate-spin" /> : 'Confirm Assignment'}
                                </button>
                             </>
                         )}
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
