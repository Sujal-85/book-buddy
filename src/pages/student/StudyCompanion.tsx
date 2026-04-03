import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, PlusCircle, Square, Languages, Search, BookOpen, Quote, Paperclip, X, FileText, Image as ImageIcon, Mic } from 'lucide-react';
import { askStudyCompanion } from '@/services/aiBackend';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/context/AuthContext';
import { useBooks } from '@/hooks/useBooks';

type Message = { role: 'user' | 'assistant'; content: string };

const suggestions = [
  { icon: Search, text: 'Recommend books for my branch', color: 'text-blue-500' },
  { icon: BookOpen, text: 'How do I borrow a book?', color: 'text-green-500' },
  { icon: Languages, text: 'Explain a complex topic simply', color: 'text-purple-500' },
  { icon: Quote, text: 'Summarize recent study trends', color: 'text-orange-500' },
];

const StudyCompanion: React.FC = () => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { data: allBooks } = useBooks();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const storageKey = `study_companion_history_${user?.uid || 'guest'}`;

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved messages:', e);
      }
    }
    return [
      { 
        role: 'assistant', 
        content: `Hello! I am your AI study companion. I’m here to help you break down complex topics, practice problem-solving, and prepare for exams. By the way, you can now **attach PDFs and images** for me to analyze! 📄📸

To give you a taste of how I can help, let’s look at a foundational concept in effective learning called **The Feynman Technique**. This is a great strategy to use whenever you are struggling to understand a new or difficult idea.

### Concept: The Feynman Technique
Named after the Nobel Prize-winning physicist Richard Feynman, this technique is based on the idea that **if you can’t explain a concept simply, you don’t understand it well enough.**

The technique involves four main steps:

1. **Choose a concept**: Pick a topic you want to learn (e.g., Photosynthesis, Supply and Demand, or Gravity).
2. **Explain it to a "child"**: Write down an explanation of the concept as if you were teaching it to someone who has no background in the subject. Avoid using jargon or "fancy" words.
3. **Identify gaps**: When you get stuck or find yourself using technical terms, go back to your source material to refine your understanding.
4. **Simplify and Analogize**: Create a simple analogy to make the concept stick.

Ready to try it? Tell me a topic you're studying, or ask me for a book recommendation! 📚✨` 
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success('Listening...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      toast.error('Voice recognition failed.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const fileToData = (file: File): Promise<{ data: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve({ data: base64String, mimeType: file.type });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const sendMessage = async (text: string) => {
    if (!text || !text.trim() || loading) return;
    
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 1. Convert files to Base64
      const fileData = await Promise.all(selectedFiles.map(fileToData));
      setSelectedFiles([]); // Clear previews

      const context = {
        userProfile: user ? {
          name: user.name,
          branch: user.branch,
          studentId: user.studentId
        } : null,
        libraryBooks: allBooks?.slice(0, 50).map(b => ({
          title: b.title,
          author: b.author,
          category: b.category,
          available: b.available
        })) || [],
        fileData // New field
      };

      const response = await askStudyCompanion(text, context);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Study companion error:', error);
      toast.error('Failed to get response. Please try again.');
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        sendMessage(input);
      }
    }
  };

  const resetChat = () => {
    const freshMessages: Message[] = [{ 
      role: 'assistant', 
      content: "Conversation reset. How can I help you starting fresh today? 📚" 
    }];
    setMessages(freshMessages);
    localStorage.setItem(storageKey, JSON.stringify(freshMessages));
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background relative overflow-hidden -m-4 lg:-m-6">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-accent/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar pt-6 md:pt-12"
      >
        <div className="max-w-3xl mx-auto w-full px-4 md:px-0 space-y-10 pb-48">
          
          {/* Empty State / Welcome Screen */}
          {messages.length <= 1 && !loading && (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center mb-6 shadow-2xl shadow-accent/20">
                <Bot className="h-8 w-8 text-accent-foreground" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-3">What can I help with?</h2>
              <p className="text-muted-foreground max-w-md text-sm mb-12 px-6">
                Your personal academic assistant for discovery, recommendations, and study guidance.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                {suggestions.map((s) => (
                  <button 
                    key={s.text} 
                    onClick={() => sendMessage(s.text)} 
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-card/50 hover:bg-accent/5 hover:border-accent/40 hover:scale-[1.02] transition-all text-left shadow-sm group"
                  >
                    <div className={`p-2 rounded-lg bg-background ${s.color} group-hover:scale-110 transition-transform`}>
                      <s.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actual Messages */}
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-400 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0 mt-1 shadow-md border border-accent/20">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              
              <div className={`
                ${msg.role === 'user' 
                  ? 'max-w-[80%] bg-accent text-accent-foreground py-3 px-5 rounded-2xl rounded-tr-none shadow-lg' 
                  : 'max-w-[100%] md:max-w-full text-foreground py-1 text-[15.5px] leading-relaxed w-full'}
              `}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none 
                    prose-p:leading-relaxed prose-p:mb-4 last:prose-p:mb-0
                    prose-headings:font-bold prose-headings:mb-3 prose-headings:mt-6 first:prose-headings:mt-0
                    prose-a:text-accent prose-a:underline
                    prose-strong:text-foreground prose-strong:font-bold
                    prose-hr:border-border prose-hr:my-6
                    prose-ul:list-disc prose-ul:pl-4 prose-ul:mb-4
                    prose-ol:list-decimal prose-ol:pl-4 prose-ol:mb-4
                    prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:pl-4 prose-blockquote:italic
                    prose-table:w-full prose-table:border-collapse prose-table:mb-4
                    prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-accent/5
                    prose-td:border prose-td:border-border prose-td:p-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-4 md:gap-6 animate-in fade-in duration-300 transition-all">
              <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 py-4">
                <div className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-duration:0.8s]" />
                <div className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-duration:0.8s] delay-150" />
                <div className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-duration:0.8s] delay-300" />
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {/* Input Overlay with Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none p-4 md:p-6 pb-8 md:pb-12">
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/90 to-transparent" />
        
        <div className="relative max-w-3xl mx-auto w-full pointer-events-auto">
          {/* Action Row */}
          <div className="flex justify-center mb-4">
            {messages.length > 1 && (
              <button 
                onClick={resetChat}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shadow-sm"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                New Chat
              </button>
            )}
          </div>

          <div className="relative group shadow-2xl shadow-accent/5 rounded-[26px]">
            {/* File Previews */}
            {selectedFiles.length > 0 && (
              <div className="bg-card/95 backdrop-blur-xl border-x border-t border-border/80 rounded-t-[26px] p-3 flex flex-wrap gap-2 animate-in slide-in-from-bottom-4 duration-300">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-lg px-3 py-1.5 text-[12px] group/file">
                    {f.type.startsWith('image/') ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                    <span className="max-w-[120px] truncate">{f.name}</span>
                    <button onClick={() => removeFile(i)} className="hover:text-destructive transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={`relative bg-card/95 backdrop-blur-xl border border-border/80 ${selectedFiles.length > 0 ? 'rounded-b-[26px]' : 'rounded-[26px]'} overflow-hidden flex items-end p-2 pr-4 gap-2 transition-all focus-within:border-accent/40 focus-within:shadow-xl`}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                multiple 
                className="hidden" 
                accept="application/pdf,image/*"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="h-12 w-12 flex items-center justify-center text-muted-foreground hover:text-accent hover:bg-accent/5 rounded-full transition-all"
                title="Attach Syllabus or Diagram"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              <button 
                onClick={startVoiceSearch}
                className={`h-12 w-12 flex items-center justify-center rounded-full transition-all ${isListening ? 'text-accent bg-accent/10 animate-pulse ring-2 ring-accent/20' : 'text-muted-foreground hover:text-accent hover:bg-accent/5'}`}
                title="Voice Search"
              >
                <Mic className="h-5 w-5" />
              </button>
              
              <textarea 
                ref={textareaRef}
                rows={1}
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={handleKeyDown}
                placeholder="Message Study Companion..." 
                className="flex-1 bg-transparent border-none outline-none focus:ring-0 shadow-none text-[15.5px] px-4 py-3.5 resize-none max-h-[200px] overflow-y-auto custom-scrollbar placeholder:text-muted-foreground/30 transition-all leading-relaxed"
              />
              
              <div className="pb-2">
                {loading ? (
                  <button 
                    disabled 
                    className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center cursor-not-allowed animate-in zoom-in-50 duration-300"
                  >
                    <Square className="h-4 w-4 fill-current animate-pulse" />
                  </button>
                ) : (
                  <button 
                    onClick={() => sendMessage(input)} 
                    disabled={!input.trim()}
                    className={`
                      h-10 w-10 rounded-full transition-all flex items-center justify-center
                      ${!input.trim() 
                        ? 'text-muted-foreground bg-transparent border border-transparent' 
                        : 'text-accent-foreground bg-accent hover:scale-110 active:scale-95 shadow-lg shadow-accent/20'}
                    `}
                  >
                    <Send className={`h-[18px] w-[18px] ${input.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <p className="text-[10px] text-center text-muted-foreground mt-4 tracking-tight opacity-40">
            AI Study Companion can make mistakes. Verify important academic information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudyCompanion;
