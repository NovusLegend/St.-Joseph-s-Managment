import React, { useState } from 'react';
import { House } from '../types';
import { suggestHousePointReason } from '../services/geminiService';
import { Plus, Minus, Wand2, Loader2, Award } from 'lucide-react';

interface HouseManagerProps {
  houses: House[];
  onUpdatePoints: (houseId: string, points: number) => Promise<void>;
}

export const HouseManager: React.FC<HouseManagerProps> = ({ houses, onUpdatePoints }) => {
  const [selectedHouseId, setSelectedHouseId] = useState<string>(houses[0]?.id || '');
  const [pointsInput, setPointsInput] = useState<number>(10);
  const [reason, setReason] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update selected house if houses array refreshes and current selection is missing or empty
  React.useEffect(() => {
     if (houses.length > 0 && !houses.find(h => h.id === selectedHouseId)) {
         setSelectedHouseId(houses[0].id);
     }
  }, [houses, selectedHouseId]);

  const selectedHouse = houses.find(h => h.id === selectedHouseId);

  const handleAiSuggest = async () => {
    if (!selectedHouse) return;
    setLoadingAi(true);
    const suggestions = await suggestHousePointReason(selectedHouse.name);
    setAiSuggestions(suggestions);
    setLoadingAi(false);
  };

  const handleApplyPoints = async (multiplier: number) => {
    if (selectedHouseId) {
      setIsUpdating(true);
      await onUpdatePoints(selectedHouseId, pointsInput * multiplier);
      setIsUpdating(false);
      setReason('');
      setAiSuggestions([]);
    }
  };

  if (!selectedHouse && houses.length === 0) {
      return <div>Loading houses...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">House Point Management</h2>
        <p className="text-slate-500 text-sm mt-1">Award or deduct points to drive student engagement.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: House List */}
        <div className="space-y-4">
          {houses.map((house) => (
            <div 
              key={house.id}
              onClick={() => {
                  setSelectedHouseId(house.id);
                  setAiSuggestions([]);
                  setReason('');
              }}
              className={`group cursor-pointer relative overflow-hidden rounded-xl border transition-all duration-200 ${
                selectedHouseId === house.id 
                  ? 'border-indigo-600 shadow-md ring-1 ring-indigo-600' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: house.color }}></div>
              <div className="p-5 pl-6 flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{house.name}</h3>
                  <p className="text-sm text-slate-500">{house.members} Members</p>
                </div>
                <div className="text-right">
                  <span className="block text-2xl font-bold text-slate-900">{house.points}</span>
                  <span className="text-xs uppercase font-semibold text-slate-400">Total Points</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Action Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
           <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Award className="text-indigo-600" size={24} />
              </div>
              <div>
                  <h3 className="font-semibold text-slate-800">Point Allocator</h3>
                  <p className="text-sm text-slate-500">Managing: <span className="font-bold text-indigo-600">{selectedHouse?.name}</span></p>
              </div>
           </div>

           <div className="space-y-6 flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Points Amount</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    value={pointsInput}
                    onChange={(e) => setPointsInput(Math.max(1, parseInt(e.target.value) || 0))}
                    className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-lg py-2 px-3 border"
                  />
                  <div className="flex gap-2">
                    <button 
                        onClick={() => setPointsInput(10)}
                        className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                    >10</button>
                    <button 
                        onClick={() => setPointsInput(50)}
                        className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                    >50</button>
                     <button 
                        onClick={() => setPointsInput(100)}
                        className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                    >100</button>
                  </div>
                </div>
              </div>

              <div>
                 <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">Reason</label>
                    <button 
                        onClick={handleAiSuggest}
                        disabled={loadingAi}
                        className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors disabled:opacity-50"
                    >
                        {loadingAi ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12} />}
                        AI Suggest
                    </button>
                 </div>
                 <textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border h-24 resize-none"
                    placeholder="e.g., Outstanding performance in the regional debate..."
                 />
                 {aiSuggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
                        {aiSuggestions.map((s, i) => (
                            <button 
                                key={i}
                                onClick={() => setReason(s)}
                                className="text-xs bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1.5 rounded-full hover:bg-violet-100 transition-colors text-left"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                 )}
              </div>
           </div>

           <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleApplyPoints(-1)}
                disabled={isUpdating}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="animate-spin" size={16} /> : <Minus size={16} />}
                Deduct
              </button>
              <button 
                onClick={() => handleApplyPoints(1)}
                disabled={isUpdating}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                Award
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};