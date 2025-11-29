import React, { useMemo } from 'react';
import { ElectionCandidate, House } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { UserCheck, Activity } from 'lucide-react';

interface ElectionCenterProps {
  candidates: ElectionCandidate[];
  houses: House[];
}

export const ElectionCenter: React.FC<ElectionCenterProps> = ({ candidates, houses }) => {
  
  // Aggregate data for chart
  const data = useMemo(() => {
    return candidates.map(c => ({
        name: c.name,
        value: c.votes,
        houseColor: houses.find(h => h.id === c.houseId)?.color || '#cbd5e1'
    }));
  }, [candidates, houses]);

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
  const leadingCandidate = [...candidates].sort((a, b) => b.votes - a.votes)[0];

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Election Center</h2>
          <p className="text-slate-500 text-sm mt-1">Live results for <span className="font-semibold text-slate-700">Head Prefect 2024</span></p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
            <Activity size={16} className="text-indigo-600 animate-pulse" />
            <span className="text-sm font-medium text-slate-700">Polls Close: 4:00 PM</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Live Vote Distribution</h3>
            <div className="h-[400px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.houseColor} strokeWidth={0} />
                            ))}
                        </Pie>
                        <RechartsTooltip 
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center mt-[-20px]">
                <span className="text-3xl font-bold text-slate-900">{totalVotes}</span>
                <p className="text-sm text-slate-500">Votes Counted</p>
            </div>
        </div>

        {/* Candidate List */}
        <div className="space-y-4">
            {candidates
            .sort((a, b) => b.votes - a.votes)
            .map((candidate, idx) => {
                const house = houses.find(h => h.id === candidate.houseId);
                const isLeader = idx === 0;
                
                return (
                <div key={candidate.id} className={`bg-white rounded-xl border p-4 transition-all ${isLeader ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'border-slate-200'}`}>
                   <div className="flex items-center gap-4">
                       <div className="relative">
                         <img src={candidate.avatar} alt={candidate.name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-100" />
                         {isLeader && (
                             <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-1 border-2 border-white">
                                 <UserCheck size={10} fill="white" />
                             </div>
                         )}
                       </div>
                       <div className="flex-1">
                           <h4 className="font-bold text-slate-900">{candidate.name}</h4>
                           <p className="text-xs font-medium" style={{ color: house?.color }}>{house?.name} House</p>
                       </div>
                       <div className="text-right">
                           <span className="block text-xl font-bold text-slate-800">{candidate.votes}</span>
                           <span className="text-xs text-slate-400">Votes</span>
                       </div>
                   </div>
                   {/* Progress Bar */}
                   <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5">
                       <div 
                        className="h-1.5 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(candidate.votes / totalVotes) * 100}%`, backgroundColor: house?.color }}
                       ></div>
                   </div>
                </div>
            )})}
        </div>

      </div>
    </div>
  );
};
