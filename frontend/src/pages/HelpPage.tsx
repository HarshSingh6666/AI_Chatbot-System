import { HelpCircle, MessageCircle, FileText, Mail } from 'lucide-react';
import PageLayout from '../components/PageLayout';

export default function HelpPage() {
  const faqs = [
    {
      q: "How does the AI model generate responses?",
      a: "Our chatbot uses state-of-the-art language models (like Gemini) to understand and generate human-like text based on your prompts and the context of the conversation."
    },
    {
      q: "Is my conversation history private?",
      a: "Yes, your conversations are private to your account. We do not use your personal chat history to train public models without your explicit consent."
    },
    {
      q: "How do I attach files?",
      a: "Click the paperclip icon in the message input area to attach text files, documents, or images. The AI will analyze the contents of the attached file if supported."
    },
    {
      q: "Can I delete my chat history?",
      a: "Yes. You can delete individual chats from the sidebar by clicking the trash icon, or you can clear your entire history from the Settings > Privacy menu."
    }
  ];

  return (
    <PageLayout title="Help & FAQ">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content - FAQs */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-black/5 border border-zinc-200/50 dark:border-zinc-800/50 p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-8 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-500" />
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-8">
              {faqs.map((faq, i) => (
                <div key={i} className="space-y-2">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{faq.q}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sidebar Support cards */}
        <div className="space-y-4">
          <SupportCard 
            icon={<MessageCircle className="w-5 h-5" />}
            title="Chat Support"
            desc="Talk with our human support team for personalized help."
            action="Start a Chat"
          />
          <SupportCard 
            icon={<FileText className="w-5 h-5" />}
            title="Documentation"
            desc="Read our detailed guides and tutorials."
            action="View Docs"
          />
          <SupportCard 
            icon={<Mail className="w-5 h-5" />}
            title="Email Us"
            desc="Send us an email anytime, we usually reply within 24 hours."
            action="support@chatai.com"
          />
        </div>
      </div>
    </PageLayout>
  );
}

function SupportCard({ icon, title, desc, action }: any) {
  return (
    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-black/5 border border-zinc-200/50 dark:border-zinc-800/50 p-6 flex flex-col">
      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 mb-6 flex-1 leading-relaxed">{desc}</p>
      <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 text-left hover:underline">
        {action}
      </button>
    </div>
  );
}
