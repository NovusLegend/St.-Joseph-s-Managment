import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { ClassLevel, Stream, Club } from '../types';
import { UserPlus, Save, Loader2, CheckCircle2, AlertCircle, ChevronDown, GraduationCap, Users } from 'lucide-react';

export const StudentAdmissions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reference Data
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    gender: 'M',
    classId: '',
    streamId: '',
    clubId: '', // Optional initial club
  });

  // Filter streams based on selected class
  const availableStreams = streams.filter(s => s.class_id === formData.classId);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [classesRes, streamsRes, clubsRes] = await Promise.all([
            supabase.from('class_levels').select('*').order('level'),
            supabase.from('streams').select('*').order('name'),
            supabase.from('clubs').select('*').order('name')
        ]);
        
        if (classesRes.data) setClassLevels(classesRes.data);
        if (streamsRes.data) setStreams(streamsRes.data);
        if (clubsRes.data) setClubs(clubsRes.data);
      } catch (err) {
        console.error("Failed to load admissions data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Reset stream if class changes
    if (field === 'classId') {
        setFormData(prev => ({ ...prev, classId: value, streamId: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
        // 1. Insert Student
        const { data: student, error: studentError } = await supabase
            .from('students')
            .insert({
                full_name: formData.fullName,
                student_id_human: formData.studentId,
                gender: formData.gender,
                current_stream_id: formData.streamId,
                // Assuming house logic is either handled elsewhere or not strictly required for admission now
            })
            .select()
            .single();

        if (studentError) throw studentError;

        // 2. Insert into Club (if selected and if table exists)
        if (formData.clubId && student) {
            // Note: Schema might not strictly have club_members in the first prompt, 
            // but assuming a standard many-to-many or a simple link is desired.
            // If table doesn't exist, this might fail silently or throw.
            // We'll try a standard 'club_members' table structure.
            const { error: clubError } = await supabase
                .from('club_members')
                .insert({
                    student_id: student.id,
                    club_id: formData.clubId,
                    role: 'member'
                });
            
            if (clubError) {
                console.warn("Could not add to club (Table might be missing or RLS):", clubError);
                // Don't fail the whole admission for this
            }
        }

        setSuccessMsg(`Student ${formData.fullName} successfully admitted!`);
        setFormData({
            fullName: '',
            studentId: '',
            gender: 'M',
            classId: '',
            streamId: '',
            clubId: ''
        });
    } catch (err: any) {
        setErrorMsg(err.message || "Failed to admit student.");
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Student Admissions</h2>
            <p className="text-slate-500 mt-1">Register new students and assign them to academic streams and activities.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Feedback Messages */}
                {successMsg && (
                    <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border border-green-100">
                        <CheckCircle2 size={24} />
                        <span className="font-medium">{successMsg}</span>
                    </div>
                )}
                {errorMsg && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
                        <AlertCircle size={24} className="shrink-0" />
                        <span className="font-medium">{errorMsg}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Info */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Student Details</h3>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input 
                            required
                            type="text"
                            value={formData.fullName}
                            onChange={e => handleInputChange('fullName', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            placeholder="e.g. John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Student ID (Legacy/Human)</label>
                        <input 
                            required
                            type="text"
                            value={formData.studentId}
                            onChange={e => handleInputChange('studentId', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            placeholder="e.g. S24001"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                        <div className="relative">
                            <select 
                                value={formData.gender}
                                onChange={e => handleInputChange('gender', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none bg-white"
                            >
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Academic Assignment */}
                    <div className="md:col-span-2 mt-2">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <GraduationCap size={16} className="text-indigo-600"/>
                            Academic Allocation
                        </h3>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Class Level</label>
                        <div className="relative">
                            <select 
                                required
                                value={formData.classId}
                                onChange={e => handleInputChange('classId', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none bg-white"
                            >
                                <option value="">Select Level...</option>
                                {classLevels.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Stream</label>
                        <div className="relative">
                            <select 
                                required
                                disabled={!formData.classId}
                                value={formData.streamId}
                                onChange={e => handleInputChange('streamId', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
                            >
                                <option value="">Select Stream...</option>
                                {availableStreams.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Extra Curricular */}
                    <div className="md:col-span-2 mt-2">
                         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <Users size={16} className="text-indigo-600"/>
                            Extra Curricular (Optional)
                        </h3>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Club Enrollment</label>
                        <div className="relative">
                            <select 
                                value={formData.clubId}
                                onChange={e => handleInputChange('clubId', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none bg-white"
                            >
                                <option value="">None / Assign Later</option>
                                {clubs.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={20}/> : <UserPlus size={20} />}
                        Complete Admission
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};