import React from 'react';
import { House } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, TrendingUp, AlertCircle, Calendar, GraduationCap } from 'lucide-react';

interface DashboardProps {
  houses: House[];
}

export const Dashboard: React.FC<DashboardProps> = ({ houses }) => {
  const sortedHouses = [...houses].sort((a, b) => b.points - a.points);
  const topHouse = sortedHouses[0];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6 rounded-2xl flex flex-col relative overflow-hidden group bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl shadow-indigo-500/20">
          <h3 className="text-sm font-medium text-indigo-200 mb-4">Academic Status</h3>
          <div className="mt-auto">
             <span className="text-3xl font-bold">Term 1</span>
             <p className="text-xs text-indigo-200 mt-1">Week 8 of 12</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col">
          <h3 className="text-sm font-medium text-slate-500 mb-4">Top House</h3>
          <div className="mt-auto">
            <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-800">{topHouse?.name || '--'}</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full text-xs font-semibold">
              <TrendingUp size={12} />
              {topHouse?.points || 0} Points
            </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Culture Performance</h3>
            <button className="text-sm text-indigo-600 font-medium hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors">View Report</button>
          </div>
          <div className="h-80 w-full">
            {houses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={houses} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, dy: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                        cursor={{fill: 'rgba(241, 245, 249, 0.5)'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                    />
                    <Bar dataKey="points" radius={[6, 6, 0, 0]} barSize={40}>
                    {houses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    No house data available
                </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="glass-card p-0 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100">
             <h3 className="text-lg font-bold text-slate-800">System Alerts</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] p-6 space-y-6">
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
          <div className="p-4 bg-slate-50/50 mt-auto">
             <button className="w-full text-center text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-indigo-600 transition-colors">
                View All Alerts
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};