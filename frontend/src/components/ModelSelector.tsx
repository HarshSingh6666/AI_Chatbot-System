import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles, Bot, Zap, BrainCircuit } from 'lucide-react';
import { cn } from '../lib/utils';
import { useChatStore } from '../store/useChatStore';

export const MODELS = [
  { id: 'gemini-3.8-pro', name: 'Gemini Pro', icon: <Sparkles className="w-4 h-4 text-purple-500" />, desc: 'Best for complex tasks' },
  { id: 'gemini-3.8-flash', name: 'Gemini Flash', icon: <Zap className="w-4 h-4 text-yellow-500" />, desc: 'Fast and versatile' },
  // 👉 OpenAI & Claude temporarily commented out due to credit limitations
  // { id: 'gpt-4o', name: 'GPT-4o', icon: <Bot className="w-4 h-4 text-green-500" />, desc: 'OpenAI flagship model' },
  // { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', icon: <BrainCircuit className="w-4 h-4 text-orange-500" />, desc: 'Anthropic intelligence' }
];

export default function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Zustand store se state nikal rahe hain (Default to gemini-3.8-flash)
  const modelId = useChatStore((state: any) => state.modelId || 'gemini-3.8-flash');
  const setModelId = useChatStore((state: any) => state.setModelId || (() => {}));
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = MODELS.find(m => m.id === modelId) || MODELS[1];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all active:scale-95 group bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50"
      >
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:from-indigo-600 group-hover:to-purple-600 transition-colors">
          ChatAI
        </span>
        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {selectedModel.icon}
          {selectedModel.name}
          <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 space-y-1">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  setModelId(model.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors",
                  model.id === selectedModel.id 
                    ? "bg-indigo-50 dark:bg-indigo-500/10" 
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    model.id === selectedModel.id ? "bg-white dark:bg-zinc-800 shadow-sm" : "bg-zinc-100 dark:bg-zinc-800"
                  )}>
                    {model.icon}
                  </div>
                  <div>
                    <div className={cn(
                      "text-sm font-medium",
                      model.id === selectedModel.id ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-900 dark:text-zinc-100"
                    )}>
                      {model.name}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {model.desc}
                    </div>
                  </div>
                </div>
                {model.id === selectedModel.id && (
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}