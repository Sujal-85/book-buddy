import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';

type Message = { role: 'user' | 'assistant'; content: string };

const suggestions = [
  'Recommend books for GATE preparation',
  'Explain binary search tree concepts',
  'Summarize "Clean Code" by Robert Martin',
  'What are the best AI/ML books for beginners?',
  'Help me create a study plan for DSA',
];

const StudyCompanion: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your AI Study Companion 📚. I can help you with:\n\n• **Book recommendations** based on your courses\n• **Concept explanations** from library books\n• **Study plans** tailored to your syllabus\n• **Book summaries** to help you decide what to read\n\nHow can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const responses: Record<string, string> = {
        'gate': "For GATE preparation, I recommend:\n\n1. **Introduction to Algorithms** by Cormen (Available ✅)\n2. **Operating System Concepts** by Silberschatz (Available ✅)\n3. **Computer Networks** by Tanenbaum (Issued ❌)\n4. **Digital Logic & Computer Design** by Morris Mano (Available ✅)\n\nWould you like me to create a study schedule using these books?",
        'clean code': "📖 **Clean Code** by Robert C. Martin\n\n**Key Takeaways:**\n- Meaningful names: Variables & functions should reveal intent\n- Small functions: Each should do ONE thing\n- Comments: Code should be self-documenting\n- Error handling: Use exceptions, not return codes\n- Testing: Follow TDD — write tests first\n\nThis book is currently **available** in our library. Want me to send a borrow request?",
        'default': "That's a great question! Based on your reading history and course enrollment, here are some suggestions:\n\n1. Check out our **AI & ML** section — we recently added 15 new titles\n2. The **Competitive Exam** section has GATE prep materials\n3. You can access **NPTEL video lectures** through our digital library\n\nWould you like me to find specific books on this topic?",
      };
      const key = text.toLowerCase().includes('gate') ? 'gate' : text.toLowerCase().includes('clean code') ? 'clean code' : 'default';
      setMessages((prev) => [...prev, { role: 'assistant', content: responses[key] }]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="AI Study Companion" description="Your personal AI assistant for study help and book recommendations" />
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-lg px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-foreground'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-accent-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center"><Sparkles className="h-4 w-4 text-accent animate-spin" /></div>
              <div className="bg-secondary rounded-lg px-4 py-3"><div className="flex gap-1"><span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" /><span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} /><span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} /></div></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pb-3">
            {suggestions.map((s) => (
              <button key={s} onClick={() => sendMessage(s)} className="text-xs px-3 py-1.5 rounded-full border border-border bg-background text-foreground hover:bg-secondary">{s}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-3 pt-3 border-t border-border">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)} placeholder="Ask me anything about books or studies..." className="flex-1 px-4 py-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <LibButton onClick={() => sendMessage(input)} disabled={loading || !input.trim()}><Send className="h-4 w-4" /></LibButton>
        </div>
      </div>
    </div>
  );
};

export default StudyCompanion;
