import React from 'react';
import { Users, AlertCircle, Calendar, GraduationCap } from 'lucide-react';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl flex flex-col relative overflow-hidden group bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl shadow-indigo-500/20">
          <h3 className="text-sm font-medium text-indigo-200 mb-4">Academic Status</h3>
          <div className="mt-auto">
             <span className="text-3xl font-bold">Term 1</span>
             <p className="text-xs text-indigo-200 mt-1">Week 8 of 12</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col">
          <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-slate-500">Upcoming Event</h3>
              <Calendar size={20} className="text-indigo-400" />
          </div>
          <div className="mt-auto">
             <span className="text-xl font-bold text-slate-800">Sports Gala</span>
             <p className="text-xs text-indigo-600 font-medium mt-1">This Friday, 2:00 PM</p>
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
                <p className="text-xs text-slate-500 mt-1">Term 2 Schedule Updated</p>
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