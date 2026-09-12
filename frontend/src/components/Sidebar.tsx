import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, MessageSquare, Settings, HelpCircle, LogOut, Trash2, Edit2, Bot } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { api } from '../lib/api';
import { isToday, isYesterday, subDays, isAfter } from 'date-fns';
import { cn } from '../lib/utils';

export default function Sidebar({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuthStore();
  const { conversations, currentConversationId, deleteConversation } = useChatStore();
  const navigate = useNavigate();
  
  const [search, setSearch] = useState('');

  const handleNewChat = () => {
    navigate('/');
    onClose();
  };

 const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.chat.deleteConversation(id);
    } catch (err) {
      console.error('Failed to delete chat on server, clearing locally:', err);
    } finally {
      // ✅ Chahe server successfully delete kare ya 404 de, UI state se turant hata do
      deleteConversation(id);
      if (currentConversationId === id) {
        navigate('/');
      }
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    try {
      await api.chat.updateConversation(id, { title: newTitle });
      useChatStore.getState().updateConversation(id, { title: newTitle });
    } catch (err) {
      console.error('Failed to rename chat:', err);
    }
  };

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const lowerSearch = search.toLowerCase();
    return conversations.filter(c => c.title.toLowerCase().includes(lowerSearch));
  }, [conversations, search]);

  const groupedConversations = useMemo(() => {
    const groups = {
      today: [] as typeof conversations,
      yesterday: [] as typeof conversations,
      previous7Days: [] as typeof conversations,
      older: [] as typeof conversations,
    };
    
    const sevenDaysAgo = subDays(new Date(), 7);

    filteredConversations.forEach(c => {
      const date = new Date(c.updatedAt || Date.now());
      if (isToday(date)) {
        groups.today.push(c);
      } else if (isYesterday(date)) {
        groups.yesterday.push(c);
      } else if (isAfter(date, sevenDaysAgo)) {
        groups.previous7Days.push(c);
      } else {
        groups.older.push(c);
      }
    });

    return groups;
  }, [filteredConversations]);

  return (
    <>
      <div className="h-full flex flex-col bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl border-r border-zinc-200/50 dark:border-zinc-800/50 transition-colors">
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <Link to="/" onClick={handleNewChat} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">ChatAI</span>
          </Link>
          <button 
            onClick={handleNewChat}
            className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pb-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-950 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-hide py-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center text-sm text-zinc-500 mt-4">
              {search ? 'No results found' : 'No chats yet'}
            </div>
          ) : (
            <>
              {groupedConversations.today.length > 0 && (
                <div>
                  <h3 className="px-3 text-xs font-semibold text-zinc-500 mb-1">Today</h3>
                  <div className="space-y-0.5">
                    {groupedConversations.today.map(c => {
                      const chatId = c.id || (c as any)._id;
                      return (
                        <ChatItem 
                          key={chatId} 
                          chat={c} 
                          isActive={currentConversationId === chatId}
                          onDelete={(e) => handleDelete(chatId, e)}
                          onRename={handleRename}
                          onClose={onClose}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              {groupedConversations.yesterday.length > 0 && (
                <div>
                  <h3 className="px-3 text-xs font-semibold text-zinc-500 mt-4 mb-1">Yesterday</h3>
                  <div className="space-y-0.5">
                    {groupedConversations.yesterday.map(c => {
                      const chatId = c.id || (c as any)._id;
                      return (
                        <ChatItem 
                          key={chatId} 
                          chat={c} 
                          isActive={currentConversationId === chatId}
                          onDelete={(e) => handleDelete(chatId, e)}
                          onRename={handleRename}
                          onClose={onClose}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              {groupedConversations.previous7Days.length > 0 && (
                <div>
                  <h3 className="px-3 text-xs font-semibold text-zinc-500 mt-4 mb-1">Previous 7 Days</h3>
                  <div className="space-y-0.5">
                    {groupedConversations.previous7Days.map(c => {
                      const chatId = c.id || (c as any)._id;
                      return (
                        <ChatItem 
                          key={chatId} 
                          chat={c} 
                          isActive={currentConversationId === chatId}
                          onDelete={(e) => handleDelete(chatId, e)}
                          onRename={handleRename}
                          onClose={onClose}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              {groupedConversations.older.length > 0 && (
                <div>
                  <h3 className="px-3 text-xs font-semibold text-zinc-500 mt-4 mb-1">Older</h3>
                  <div className="space-y-0.5">
                    {groupedConversations.older.map(c => {
                      const chatId = c.id || (c as any)._id;
                      return (
                        <ChatItem 
                          key={chatId} 
                          chat={c} 
                          isActive={currentConversationId === chatId}
                          onDelete={(e) => handleDelete(chatId, e)}
                          onRename={handleRename}
                          onClose={onClose}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/60 mt-auto flex flex-col gap-1">
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors w-full text-left">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          
          <Link to="/help" className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors w-full text-left">
            <HelpCircle className="w-4 h-4" />
            Help & FAQ
          </Link>
          
          <div className="h-px bg-zinc-200 dark:bg-zinc-800/60 my-1"></div>
          
          <Link to="/profile" className="flex items-center justify-between px-2 py-2 mt-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3 overflow-hidden">
              <img src={user?.profileImage} alt={user?.name} className="w-8 h-8 rounded-full bg-zinc-200 object-cover" />
              <div className="truncate text-sm font-medium">{user?.name}</div>
            </div>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); logout(); }}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}

function ChatItem({ chat, isActive, onDelete, onRename, onClose }: { chat: any; isActive: boolean; onDelete: (e: any) => void; onRename: (id: string, newTitle: string) => void; onClose: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatId = chat.id || (chat as any)._id;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleRenameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim() && editTitle !== chat.title) {
      onRename(chatId, editTitle.trim());
    } else {
      setEditTitle(chat.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditTitle(chat.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-all relative overflow-hidden",
        isActive 
          ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium" 
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
      )}
    >
      <Link 
        to={`/c/${chatId}`} 
        onClick={(e) => {
          if (isEditing) e.preventDefault();
          else onClose();
        }}
        className="flex items-center gap-2 overflow-hidden flex-1 cursor-pointer"
      >
        <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
        
        {isEditing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => handleRenameSubmit()}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white dark:bg-zinc-950 px-1 py-0.5 rounded border border-indigo-500 focus:outline-none text-zinc-900 dark:text-zinc-100 text-sm w-full"
            onClick={(e) => e.preventDefault()}
          />
        ) : (
          <span className="truncate">{chat.title}</span>
        )}
      </Link>
      
      {!isEditing && (
        <div className={cn(
          "absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l to-transparent transition-opacity pointer-events-none",
          isActive ? "from-zinc-200 dark:from-zinc-800 opacity-100 group-hover:opacity-0" : "from-zinc-50 dark:from-zinc-900 group-hover:opacity-0"
        )}></div>
      )}

      {!isEditing && (
        <div className={cn(
          "absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-100 dark:bg-zinc-800/80 px-1 rounded",
          isActive ? "dark:bg-zinc-800 bg-zinc-200" : ""
        )}>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(true); }}
            className="p-1 text-zinc-400 hover:text-indigo-500 transition-colors rounded"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onDelete}
            className="p-1 text-zinc-400 hover:text-red-500 transition-colors rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}