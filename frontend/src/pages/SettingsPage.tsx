import { useState } from 'react';
import { Monitor, Moon, Sun, MessageSquare, Shield, Smartphone, X, Download, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { useThemeStore } from '../store/useThemeStore';
import { cn } from '../lib/utils';

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Helper to get auth token
  const getToken = () => localStorage.getItem('token') || '';

  // 🔹 1. Export Chat History Date-wise with User & AI messages
  const handleExportData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/conversations/export', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) throw new Error('Failed to export conversations');
      
      const conversations = await response.json();

      // Chats ko date-wise group karein (YYYY-MM-DD format mein)
      const groupedByDate = conversations.reduce((acc: any, chat: any) => {
        const dateKey = new Date(chat.createdAt || Date.now()).toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(chat);
        return acc;
      }, {});

      const exportPayload = {
        exportDate: new Date().toISOString(),
        totalConversations: conversations.length,
        chatsByDate: groupedByDate,
      };

      // JSON file download trigger karein
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chatai-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedback({ type: 'success', message: 'Chat history exported successfully with messages & dates!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to export chat history' });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 2. Delete All History using fetch
  const handleDeleteHistory = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all your conversation history? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/conversations', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete history');

      setFeedback({ type: 'success', message: 'All conversation history deleted successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete history' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="Settings">
      <div className="bg-white/90 dark:bg-zinc-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-zinc-200/60 dark:shadow-black/40 border border-zinc-200/80 dark:border-zinc-800/50 overflow-hidden">
        
        {/* Feedback Banner */}
        {feedback && (
          <div className={cn(
            "p-4 text-sm font-medium flex items-center justify-between border-b",
            feedback.type === 'success' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
          )}>
            <span className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {feedback.message}
            </span>
            <button onClick={() => setFeedback(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="p-6 md:p-8 space-y-10">
          
          {/* Appearance Section */}
          <section>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-indigo-500" />
              Appearance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ThemeCard 
                active={theme === 'light'} 
                onClick={() => setTheme('light')} 
                icon={<Sun className="w-6 h-6" />} 
                title="Light" 
                desc="Clean and bright"
              />
              <ThemeCard 
                active={theme === 'dark'} 
                onClick={() => setTheme('dark')} 
                icon={<Moon className="w-6 h-6" />} 
                title="Dark" 
                desc="Easy on the eyes"
              />
              <ThemeCard 
                active={theme === 'system'} 
                onClick={() => setTheme('system')} 
                icon={<Smartphone className="w-6 h-6" />} 
                title="System" 
                desc="Matches your device"
              />
            </div>
          </section>

          <hr className="border-zinc-100 dark:border-zinc-800/60" />

          {/* Chat Preferences Section */}
          <section>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              Chat Preferences
            </h3>
            <div className="space-y-6 max-w-2xl bg-zinc-50/50 dark:bg-transparent p-1 rounded-2xl">
              <ToggleSetting label="Enter to send" description="Pressing Enter will send the message. Use Shift+Enter for a new line." defaultChecked={true} />
              <ToggleSetting label="Auto-generate chat titles" description="Automatically create a title based on your first message." defaultChecked={true} />
              <ToggleSetting label="Sound notifications" description="Play a subtle sound when a response is complete." defaultChecked={false} />
            </div>
          </section>

          <hr className="border-zinc-100 dark:border-zinc-800/60" />

          {/* Privacy & Data Section */}
          <section>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              Data & Privacy
            </h3>
            <div className="space-y-4 max-w-2xl">
              
              {/* Export Button */}
              <button 
                onClick={handleExportData}
                disabled={loading}
                className="w-full flex items-center justify-between text-left px-5 py-4 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:shadow-sm transition-all group"
              >
                <div>
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block">
                    Export Chat History (Date-wise with Messages)
                  </span>
                  <span className="text-sm text-zinc-500 mt-0.5 block">Download all your conversations, including user and AI messages, structured and grouped by date as a JSON file.</span>
                </div>
                <Download className="w-5 h-5 text-zinc-400 group-hover:text-indigo-500 transition-colors shrink-0 ml-4" />
              </button>
              
              {/* Delete History Button */}
              <button 
                onClick={handleDeleteHistory}
                disabled={loading}
                className="w-full flex items-center justify-between text-left px-5 py-4 bg-white dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl hover:border-red-200 dark:hover:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/30 hover:shadow-sm transition-all group"
              >
                <div>
                  <span className="font-semibold text-sm text-red-600 dark:text-red-400 block">Delete all history</span>
                  <span className="text-sm text-red-500/80 mt-0.5 block">Permanently delete all conversations from your account. This action cannot be undone.</span>
                </div>
                <Trash2 className="w-5 h-5 text-red-400 shrink-0 ml-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}

function ThemeCard({ active, onClick, icon, title, desc }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start text-left p-5 rounded-xl border transition-all duration-200",
        active 
          ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-500/10 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/20" 
          : "bg-white dark:bg-transparent border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:shadow-sm"
      )}
    >
      <div className={cn(
        "mb-4 p-2.5 rounded-lg transition-colors",
        active ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
      )}>
        {icon}
      </div>
      <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{title}</div>
      <div className="text-xs text-zinc-500 leading-relaxed">{desc}</div>
    </button>
  );
}

function ToggleSetting({ label, description, defaultChecked = true }: any) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label className="flex items-center justify-between cursor-pointer group p-3 -mx-3 rounded-xl hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors">
      <div className="pr-8">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</div>
        <div className="text-sm text-zinc-500 mt-1">{description}</div>
      </div>
      <div className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 shadow-inner",
        checked ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"
      )}>
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </div>
    </label>
  );
}