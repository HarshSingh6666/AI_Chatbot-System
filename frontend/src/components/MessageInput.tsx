import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, StopCircle, X, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

export default function MessageInput({ 
  onSend, 
  isGenerating 
}: { 
  onSend: (text: string) => void;
  isGenerating: boolean;
}) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if ((text.trim() || selectedFile) && !isGenerating) {
      const messageText = selectedFile ? `[Attached File: ${selectedFile.name}]\\n${text}` : text;
      onSend(messageText.trim());
      setText('');
      setSelectedFile(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="relative flex flex-col bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 overflow-hidden">
      
      {selectedFile && (
        <div className="flex items-center gap-3 p-3 mx-3 mt-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl relative group w-fit pr-10">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate w-32">{selectedFile.name}</div>
            <div className="text-xs text-zinc-500">{(selectedFile.size / 1024).toFixed(1)} KB</div>
          </div>
          <button 
            onClick={() => setSelectedFile(null)}
            className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message AI..."
        className="w-full max-h-[200px] min-h-[56px] py-4 pl-4 pr-12 bg-transparent border-none resize-none focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 scrollbar-hide"
        rows={1}
      />
      
      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center gap-1">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <Mic className="w-5 h-5" />
          </button>
        </div>
        
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !selectedFile) || isGenerating}
          className={cn(
            "p-2 rounded-xl transition-all flex items-center justify-center",
            (text.trim() || selectedFile) && !isGenerating
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <StopCircle className="w-5 h-5" />
          ) : (
            <Send className="w-5 h-5 ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}
