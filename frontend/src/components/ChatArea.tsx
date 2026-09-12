import { useEffect, useRef } from 'react';
import {
  Bot,
  Lightbulb,
  Code,
  Bug,
  FileText,
  Sparkles,
  BookOpen,
  Menu,
  User,
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id?: string;
  conversationId?: string;
  role: 'user' | 'ai';
  content: string;
  createdAt?: string;
}

interface ChatAreaProps {
  onOpenSidebar: () => void;
}

export default function ChatArea({ onOpenSidebar }: ChatAreaProps) {
  const {
    currentConversationId,
    messages,
    isGenerating,
    addMessage,
    updateLastMessage,
    setIsGenerating,
    addConversation,
    setCurrentConversation,
  } = useChatStore() as any;

  const { user } = useAuthStore() as any;
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSendMessage = async (content: string) => {
    let chatId = currentConversationId;

    // 👇 FIXED: MongoDB returns _id, so we fallback to _id or id properly to avoid 'undefined'
    if (!chatId || chatId === 'undefined') {
      try {
        const newChat = await api.chat.createConversation(
          content.substring(0, 30)
        );
        addConversation(newChat);
        const validId = newChat._id || newChat.id;
        setCurrentConversation(validId);
        chatId = validId;
        navigate(`/c/${validId}`);
      } catch (err) {
        console.error('Failed to create conversation:', err);
        return;
      }
    }

    const tempUserMessage: Message = {
      id: uuidv4(),
      conversationId: chatId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    addMessage(tempUserMessage);

    const tempAiMessage: Message = {
      id: uuidv4(),
      conversationId: chatId,
      role: 'ai',
      content: '',
      createdAt: new Date().toISOString(),
    };
    addMessage(tempAiMessage);
    setIsGenerating(true);

    try {
      let accumulatedContent = '';
      await api.chat.sendMessage(chatId, content, (chunk: string) => {
        accumulatedContent += chunk;
        updateLastMessage(accumulatedContent);
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      updateLastMessage(
        'Sorry, I encountered an error while processing your request.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative">
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/10 dark:bg-zinc-950/10 backdrop-blur-md border-b border-zinc-200/20 dark:border-zinc-800/30 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="md:hidden p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <ModelSelector />
        </div>

        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={user?.name || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-4 h-4 text-zinc-500" />
            </div>
          )}
        </div>
      </header>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 overflow-y-auto relative scrollbar-hide z-10">
        {!currentConversationId || messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={handleSendMessage} />
        ) : (
          <div className="max-w-3xl mx-auto py-8 px-4 w-full flex flex-col gap-8">
            {messages.map((msg: Message, idx: number) => (
              <ChatMessage
                key={msg.id || idx}
                message={msg}
                userProfileImage={user?.profileImage}
              />
            ))}

            {isGenerating &&
              messages[messages.length - 1]?.role !== 'ai' && (
                <div className="flex gap-4 p-2 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 space-y-2 pt-2">
                    <div className="flex gap-1.5 items-center">
                      <span
                        className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="w-full max-w-4xl mx-auto px-4 pb-4 md:pb-6 relative z-20">
        <div className="backdrop-blur-xl bg-white/30 dark:bg-zinc-950/30 rounded-2xl p-1 shadow-2xl border border-zinc-200/30 dark:border-zinc-800/40">
          <MessageInput
            onSend={handleSendMessage}
            isGenerating={isGenerating}
          />
        </div>
        <div className="text-center mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400/80 drop-shadow-sm">
          AI can make mistakes. Check important information.
        </div>
      </div>
    </div>
  );
}

// WELCOME SCREEN
interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  const suggestions = [
    {
      icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
      title: 'Explain a concept',
      desc: 'Break down complex ideas',
    },
    {
      icon: <Code className="w-5 h-5 text-indigo-500" />,
      title: 'Write some code',
      desc: 'React, Python, SQL, etc.',
    },
    {
      icon: <Bug className="w-5 h-5 text-red-500" />,
      title: 'Help me debug',
      desc: 'Find errors in my code',
    },
    {
      icon: <FileText className="w-5 h-5 text-blue-500" />,
      title: 'Summarize something',
      desc: 'Condense long articles',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
      title: 'Generate ideas',
      desc: 'Brainstorming and creativity',
    },
    {
      icon: <BookOpen className="w-5 h-5 text-purple-500" />,
      title: 'Learn something new',
      desc: 'Teach me about a topic',
    },
  ];

  return (
    <div className="min-h-full flex flex-col items-center max-w-3xl mx-auto px-4 pt-6 pb-12 animate-in fade-in zoom-in-95 duration-700">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 dark:opacity-40 animate-pulse rounded-full" />
        <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 border border-white/20 z-10">
          <Bot className="w-10 h-10 text-white drop-shadow-md" />
        </div>
      </div>

      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-10 drop-shadow-sm text-zinc-900 dark:text-white">
        Hello,{' '}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
          How can I help you today?
        </span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(s.title)}
            className="flex flex-col text-left p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl hover:bg-white dark:hover:bg-zinc-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 group"
          >
            <div className="mb-4 p-2.5 bg-white dark:bg-zinc-800 w-fit rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
              {s.icon}
            </div>
            <h3 className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100 mb-1.5">
              {s.title}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {s.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// CHAT MESSAGE
interface ChatMessageProps {
  message: Message;
  userProfileImage?: string;
}

function ChatMessage({ message, userProfileImage }: ChatMessageProps) {
  const isAi = message.role === 'ai';

  return (
    <div className="flex gap-4 p-2 group animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="shrink-0 mt-1">
        {isAi ? (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center">
            {userProfileImage ? (
              <img
                src={userProfileImage}
                alt="User"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-zinc-400" />
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2 relative">
        <div className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          {isAi ? (
            <>
              ChatAI
              <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase tracking-wider font-bold">
                Pro
              </span>
            </>
          ) : (
            'You'
          )}
        </div>

        <div className="text-[16px] leading-relaxed text-zinc-800 dark:text-zinc-200 markdown-body prose prose-zinc dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-p:leading-relaxed prose-headings:font-semibold">
          {isAi ? (
            message.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const code = String(children).replace(/\n$/, '');

                    if (!inline && match) {
                      return (
                        <div className="rounded-2xl overflow-hidden border border-zinc-800/80 my-5 bg-[#1e1e24] shadow-2xl">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                              </div>
                              <span className="text-xs font-mono text-zinc-400 ml-2 font-medium">
                                {match[1]}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                navigator.clipboard.writeText(code)
                              }
                              className="text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md"
                            >
                              Copy
                            </button>
                          </div>
                          <SyntaxHighlighter
                            {...props}
                            style={oneDark as any}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              background: 'transparent',
                              padding: '1.25rem',
                            }}
                          >
                            {code}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }

                    return (
                      <code
                        {...props}
                        className="bg-zinc-100 dark:bg-zinc-800/80 rounded-md px-1.5 py-0.5 font-mono text-[13px] border border-zinc-200 dark:border-zinc-700"
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <div className="h-6 w-32 bg-zinc-200/50 dark:bg-zinc-800/50 rounded animate-pulse" />
            )
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>
      </div>
    </div>
  );
}