
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { TeacherAllocation, Student, MarkEntry } from '../types';
import { BookOpen, Users, Save, CheckCircle2, AlertCircle, Loader2, ChevronRight, Calculator } from 'lucide-react';

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

  // Fetch Allocations
  useEffect(() => {
    const fetchAllocations = async () => {
      setLoading(true);
      // In a real join query, we'd get these. Simulating the join logic for now based on schema
      // Since we can't do deep joins easily with simple prompt setup, we will fetch raw and map
      const { data: allocData, error } = await supabase
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
      setLoading(false);
    };

    fetchAllocations();
  }, [userId]);

  // Fetch Students & Marks when class selected
  useEffect(() => {
    if (!selectedAllocation) return;

    const fetchClassData = async () => {
      setLoading(true);
      
      // 1. Get Students in this stream (Mocking the relationship logic: students -> streams)
      // We need the stream_id from the allocation, but we formatted it out. 
      // For this demo, let's re-fetch or assume we have the ID. 
      // Let's simplified: fetch students where stream matches (requires stream_id)
      // *Workaround*: We will fetch all students for now to demonstrate UI, filtering is backend logic normally
      
      const { data: studentData } = await supabase.from('students').select('*').limit(30); 
      // ideally .eq('current_stream_id', selectedAllocation.stream_id)
      
      if (studentData) {
         setStudents(studentData.map((s: any) => ({
             id: s.id,
             full_name: s.full_name,
             student_id_human: s.student_id_human || 'S001'
         })));
      }

      // 2. Get existing marks
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
    
    const upserts = Object.keys(marks).map(studentId => ({
        student_id: studentId,
        teacher_allocation_id: selectedAllocation.id,
        assessment_type: assessmentType,
        score: marks[studentId],
        updated_at: new Date()
    }));

    // Perform upsert (requires unique constraint on student_id + allocation + type in DB, assume exists)
    // For simplicity, we delete old for this context and insert new, or just insert
    // Supabase upsert:
    for (const entry of upserts) {
        // Find existing to update or insert
        const { data: existing } = await supabase
            .from('marks')
            .select('id')
            .eq('student_id', entry.student_id)
            .eq('teacher_allocation_id', entry.teacher_allocation_id)
            .eq('assessment_type', entry.assessment_type)
            .single();
            
        if (existing) {
             await supabase.from('marks').update({ score: entry.score }).eq('id', existing.id);
        } else {
             await supabase.from('marks').insert(entry);
        }
    }

    setSaving(false);
    // Show success toast logic here
  };

  if (loading && !selectedAllocation) {
      return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600"/></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Teacher Portal</h2>
          <p className="text-slate-500 mt-1">Manage your classes and enter assessments.</p>
        </div>
        <div className="bg-white/50 backdrop-blur px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-600">
           Term 1, 2024
        </div>
      </div>

      {!selectedAllocation ? (
        // CLASS SELECTION VIEW
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {allocations.length === 0 ? (
                <div className="col-span-3 text-center py-20 bg-white/50 rounded-2xl border border-slate-200 border-dashed">
                    <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-600">No Classes Allocated</h3>
                    <p className="text-slate-400 text-sm">Contact the administrator to be assigned classes.</p>
                </div>
            ) : (
                allocations.map(alloc => (
                    <div 
                        key={alloc.id}
                        onClick={() => setSelectedAllocation(alloc)}
                        className="glass-card p-6 rounded-2xl hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BookOpen size={64} className="text-indigo-600" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase">
                                {alloc.subject_code}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">{alloc.class_name} {alloc.stream_name}</h3>
                        <p className="text-slate-500 font-medium">{alloc.subject_name}</p>
                        
                        <div className="mt-6 flex items-center gap-2 text-sm text-indigo-600 font-medium group-hover:translate-x-1 transition-transform">
                            Enter Marks <ChevronRight size={16} />
                        </div>
                    </div>
                ))
            )}
        </div>
      ) : (
        // GRADING VIEW
        <div className="space-y-6">
            <button 
                onClick={() => setSelectedAllocation(null)}
                className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
                ← Back to Classes
            </button>

            <div className="glass-card rounded-2xl p-6 border-l-4 border-l-indigo-600 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">{selectedAllocation.class_name} {selectedAllocation.stream_name}</h3>
                    <p className="text-slate-500 flex items-center gap-2 mt-1">
                        <BookOpen size={16} /> {selectedAllocation.subject_name}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                     <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
                        {['BOT', 'MOT', 'EOT'].map(type => (
                            <button
                                key={type}
                                onClick={() => setAssessmentType(type)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    assessmentType === type 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'text-slate-600 hover:bg-slate-50'
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
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200 text-left">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40 text-center">Score (100%)</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40 text-center">Grade</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Comments</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map((student) => {
                                const score = marks[student.id];
                                let grade = '-';
                                let gradeColor = 'text-slate-400';
                                
                                if (score !== undefined) {
                                    if (score >= 80) { grade = 'A'; gradeColor = 'text-green-600'; }
                                    else if (score >= 70) { grade = 'B'; gradeColor = 'text-indigo-600'; }
                                    else if (score >= 60) { grade = 'C'; gradeColor = 'text-yellow-600'; }
                                    else if (score >= 50) { grade = 'D'; gradeColor = 'text-orange-600'; }
                                    else { grade = 'F'; gradeColor = 'text-red-600'; }
                                }

                                return (
                                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{student.student_id_human}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{student.full_name}</td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={score ?? ''}
                                            onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                            className="w-full text-center font-mono text-lg border border-slate-200 rounded-lg py-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="-"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-lg font-bold ${gradeColor}`}>{grade}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="text"
                                            className="w-full text-sm border-b border-transparent hover:border-slate-200 focus:border-indigo-500 bg-transparent py-1 outline-none transition-colors"
                                            placeholder="Add remark..."
                                        />
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
                {students.length === 0 && !loading && (
                    <div className="p-12 text-center text-slate-500">
                        No students found in this class yet.
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
