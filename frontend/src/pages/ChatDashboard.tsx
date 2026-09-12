import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { useChatStore } from '../store/useChatStore';
import { api } from '../lib/api';

export default function ChatDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { chatId } = useParams();
  const navigate = useNavigate();

  const {
    setConversations,
    setCurrentConversation,
    setMessages,
  } = useChatStore();

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data =
          await api.chat.getConversations();

        setConversations(data);
      } catch (error) {
        console.error(
          'Failed to fetch conversations:',
          error
        );
      }
    };

    fetchConversations();
  }, [setConversations]);

  // Fetch current conversation
  useEffect(() => {
    if (chatId) {
      setCurrentConversation(chatId);

      const fetchMessages = async () => {
        try {
          const chat =
            await api.chat.getConversation(chatId);

          setMessages(chat.messages || []);
        } catch (error) {
          console.error(
            'Failed to fetch messages:',
            error
          );

          navigate('/');
        }
      };

      fetchMessages();
    } else {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [
    chatId,
    setCurrentConversation,
    setMessages,
    navigate,
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-zinc-900 dark:text-zinc-50 relative">

      {/* ==========================================
          BACKGROUND GLOW
          Soft circular glow - KEEP THIS
      ========================================== */}

      <div
        className="
          absolute
          top-0
          left-1/2
          -translate-x-1/2
          w-[350px]
          h-[350px]
          bg-indigo-500/40
          dark:bg-indigo-500/30
          blur-[100px]
          rounded-full
          pointer-events-none
          z-0
        "
      />

      {/* ==========================================
          MOBILE SIDEBAR BACKDROP
      ========================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72
          transform
          transition-transform
          duration-300
          ease-in-out
          md:relative
          md:translate-x-0
          ${
            sidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >
        <Sidebar
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* ==========================================
          MAIN CONTENT
      ========================================== */}

      <div className="relative z-10 flex-1 flex flex-col min-w-0 bg-transparent">

        <ChatArea
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
        />

      </div>
    </div>
  );
}