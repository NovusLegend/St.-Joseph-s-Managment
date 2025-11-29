import React from 'react';
import { ViewState, UserRole } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  GraduationCap, 
  BookOpen,
  UserPlus
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onSignOut?: () => void;
  role: UserRole;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onSignOut, role, isMobile = false }) => {
  
  const adminItems = [
    { id: ViewState.DASHBOARD, label: 'Overview', icon: LayoutDashboard },
    { id: ViewState.ACADEMICS, label: 'Academics', icon: GraduationCap },
    { id: ViewState.ADMISSIONS, label: 'Admissions', icon: UserPlus },
    { id: ViewState.CLUBS, label: 'Clubs & Societies', icon: Users },
  ];

  const teacherItems = [
    { id: ViewState.MY_CLASSES, label: 'My Classes', icon: BookOpen },
    { id: ViewState.CLUBS, label: 'Clubs', icon: Users },
  ];

  const navItems = role === 'admin' ? adminItems : teacherItems;

  return (
    <div className={`
      flex flex-col h-full
      ${isMobile ? 'w-full' : 'w-72 rounded-2xl my-4 ml-4 glass-panel shadow-xl'}
      transition-all duration-300
    `}>
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-xl">SJ</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">St. Joseph's</h1>
            <span className="text-[10px] font-semibold text-indigo-600 tracking-wider uppercase">
              Management System
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-indigo-100' : 'text-slate-400 group-hover:text-slate-600 transition-colors'} />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <button 
          onClick={onSignOut}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-all w-full"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
};