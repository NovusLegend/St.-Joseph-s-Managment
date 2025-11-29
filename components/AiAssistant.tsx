import React, { useState } from 'react';
import { generateAdminContent } from '../services/geminiService';
import { Sparkles, Send, Copy, Check, MessageSquareText, Megaphone } from 'lucide-react';

export const AiAssistant: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'announcement' | 'general'>('announcement');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setResponse('');
    setCopied(false);

    let finalPrompt = prompt;
    let context = '';

    if (activeTab === 'announcement') {
        context = 'The user wants to draft a formal school announcement to be broadcast via the app or PA system.';
    } else {
        context = 'The user is asking a general administrative question or needs help with conflict resolution.';
    }

    const result = await generateAdminContent(finalPrompt, context);
    setResponse(result);
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const predefinedPrompts = [
    "Draft a message congratulating Blue House for winning Sports Day.",
    "Write a stern but fair reminder about uniform policy.",
    "Create an invitation for the Alumni fundraising dinner.",
    "Announce the delay of the Election results by 1 hour."
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col animate-fade-in">
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="text-fuchsia-500" />
                AI Admin Assistant
            </h2>
            <p className="text-slate-500 text-sm mt-1">Powered by Google Gemini. Draft announcements and solve problems instantly.</p>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-100">
                <button 
                    onClick={() => setActiveTab('announcement')}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'announcement' ? 'text-fuchsia-600 border-b-2 border-fuchsia-600 bg-fuchsia-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Megaphone size={16} />
                    Announcement Creator
                </button>
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'general' ? 'text-fuchsia-600 border-b-2 border-fuchsia-600 bg-fuchsia-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <MessageSquareText size={16} />
                    General Inquiry
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
                {!response && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                        <Sparkles size={48} className="text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-700">How can I help you today?</h3>
                        <p className="text-sm text-slate-500 max-w-sm mt-2">Select a quick prompt below or type your own request.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full max-w-2xl">
                            {predefinedPrompts.map((p, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setPrompt(p)}
                                    className="text-left p-3 text-sm bg-white border border-slate-200 rounded-lg hover:border-fuchsia-300 hover:shadow-sm transition-all text-slate-600"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {(response || isLoading) && (
                    <div className="space-y-6">
                        {/* User Message */}
                        <div className="flex justify-end">
                            <div className="bg-slate-800 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                                <p className="text-sm leading-relaxed">{prompt}</p>
                            </div>
                        </div>

                        {/* AI Response */}
                        <div className="flex justify-start">
                             <div className="bg-white border border-slate-200 px-6 py-5 rounded-2xl rounded-tl-sm max-w-[90%] shadow-sm relative group">
                                {isLoading ? (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <div className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        <span className="text-xs font-medium ml-2">Thinking...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="prose prose-sm prose-slate max-w-none">
                                            <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{response}</p>
                                        </div>
                                        <button 
                                            onClick={copyToClipboard}
                                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Copy to clipboard"
                                        >
                                            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                        </button>
                                    </>
                                )}
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={activeTab === 'announcement' ? "Describe the announcement (e.g., 'Tell students exams start Monday')..." : "Ask a question..."}
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent resize-none shadow-inner text-sm"
                        rows={3}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleGenerate();
                            }
                        }}
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt.trim()}
                        className="absolute right-2 bottom-2 p-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="mt-2 text-center">
                    <p className="text-[10px] text-slate-400">AI can make mistakes. Verify important info.</p>
                </div>
            </div>
        </div>
    </div>
  );
};
