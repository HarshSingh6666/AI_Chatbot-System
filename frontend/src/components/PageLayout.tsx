import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PageLayout({ title, children }: { title: string, children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-transparent text-zinc-900 dark:text-zinc-50 flex flex-col relative z-10">
      <header className="flex items-center px-6 py-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl border-b border-zinc-200/50 dark:border-zinc-800/50 sticky top-0 z-20">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 mr-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      </header>
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>
    </div>
  );
}
