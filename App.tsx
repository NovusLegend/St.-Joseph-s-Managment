import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { StudentAdmissions } from './components/StudentAdmissions';
import { SchoolEventsManager } from './components/SchoolEventsManager';
import { Auth } from './components/Auth';
import { TeacherPortal } from './components/TeacherPortal';
import { AdminAcademics } from './components/AdminAcademics';
import { ViewState, UserProfile } from './types';
import { Menu, Loader2, LogOut, WifiOff } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // 1. Auth Listener
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        if (!session) setLoadingSession(false);
      } catch (err) {
        console.error("Auth initialization failed:", err);
        setConnectionError(true);
        setLoadingSession(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if(!session) {
          setProfile(null);
          setLoadingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Profile when Session Exists
  useEffect(() => {
      if (session && !profile) {
          const fetchProfile = async () => {
              try {
                  const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                  
                  // Handle "Row not found" (PGRST116) or success
                  if (data) {
                      setProfile(data as UserProfile);
                      // Set default view based on role
                      if (data.role === 'teacher') {
                          setCurrentView(ViewState.MY_CLASSES);
                      } else if (data.role === 'editor') {
                          setCurrentView(ViewState.EVENTS);
                      } else {
                          setCurrentView(ViewState.DASHBOARD);
                      }
                  } else {
                      // Profile missing (Trigger might have failed). Attempt manual creation.
                      console.warn("Profile not found. Attempting manual creation...");
                      const { data: newProfile, error: insertError } = await supabase
                        .from('profiles')
                        .insert({
                            id: session.user.id,
                            email: session.user.email,
                            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                            role: session.user.user_metadata?.role || 'student',
                            updated_at: new Date()
                        })
                        .select()
                        .single();

                       if (newProfile) {
                           setProfile(newProfile as UserProfile);
                           if (newProfile.role === 'teacher') {
                                setCurrentView(ViewState.MY_CLASSES);
                           } else if (newProfile.role === 'editor') {
                                setCurrentView(ViewState.EVENTS);
                           } else {
                                setCurrentView(ViewState.DASHBOARD);
                           }
                       } else {
                           console.error("Failed to create profile manually:", insertError);
                           // Fallback: If we really can't get a profile, sign out to reset state
                           await supabase.auth.signOut();
                       }
                  }
              } catch (err) {
                  console.error("Critical profile fetch error:", err);
                  await supabase.auth.signOut();
              } finally {
                  setLoadingSession(false);
              }
          };
          fetchProfile();
      }
  }, [session, profile]);

  const handleSignOut = async () => {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
  };

  if (connectionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] gap-4 p-4 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
           <WifiOff size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Connection Failed</h2>
        <p className="text-slate-500 max-w-sm">Unable to connect to the system. Please check your internet connection and reload.</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Retry Connection
        </button>
      </div>
    );
  }

  if (loadingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium animate-pulse">Initializing System...</p>
      </div>
    );
  }

  if (!session) return <Auth />;
  
  if (!profile) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] gap-4">
              <div className="text-slate-600">Profile Setup Incomplete</div>
              <button onClick={handleSignOut} className="text-indigo-600 hover:underline flex items-center gap-2">
                 <LogOut size={16} /> Sign Out & Retry
              </button>
          </div>
      )
  }

  const renderContent = () => {
    switch (currentView) {
      // Admin Views
      case ViewState.DASHBOARD:
        return profile.role === 'admin' || profile.role === 'editor' ? <Dashboard /> : <TeacherPortal userId={session.user.id} />;
      case ViewState.ACADEMICS:
        return <AdminAcademics />;
      case ViewState.ADMISSIONS:
        return <StudentAdmissions />;
      case ViewState.EVENTS:
        return <SchoolEventsManager />;
      
      // Teacher Views
      case ViewState.MY_CLASSES:
      case ViewState.GRADING:
        return <TeacherPortal userId={session.user.id} />;
        
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Mobile Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="h-full bg-white/90 backdrop-blur-xl shadow-2xl p-4">
            <Sidebar currentView={currentView} setView={(v) => { setCurrentView(v); setMobileMenuOpen(false); }} onSignOut={handleSignOut} role={profile.role} isMobile={true} />
         </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0 z-20">
         <Sidebar currentView={currentView} setView={setCurrentView} onSignOut={handleSignOut} role={profile.role} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto custom-scrollbar">
        
        {/* Mobile Header */}
        <div className="md:hidden p-4 flex items-center justify-between sticky top-0 z-10 glass-panel border-b-0 m-4 rounded-xl mb-0">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SJ</span>
             </div>
             <span className="font-bold text-slate-800">St. Joseph's</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-white/50 rounded-lg transition-colors">
            <Menu size={24} />
          </button>
        </div>

        {/* Content Wrapper */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-20">
            {/* Greeting */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                   <h1 className="text-xl md:text-2xl font-medium text-slate-800">
                    Hello, <span className="font-bold">{profile.full_name}</span> 👋
                   </h1>
                   <p className="text-sm text-slate-500">
                    {profile.role === 'admin' && "Managing St. Joseph's Ecosystem."}
                    {profile.role === 'teacher' && "Empowering students today."}
                    {profile.role === 'editor' && "Updating school activities."}
                   </p>
                </div>
                <div className="hidden md:flex items-center gap-3">
                   {profile.avatar_url ? (
                       <img src={profile.avatar_url} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Profile" />
                   ) : (
                       <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold border-2 border-white shadow-sm">
                        {profile.full_name[0]}
                       </div>
                   )}
                </div>
            </div>

           {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;