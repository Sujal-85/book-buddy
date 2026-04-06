import React, { useState } from 'react';
import { Mic, MicOff, Search, BookOpen, Sparkles } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';
import { processVoiceQuery, VoiceQueryResult } from '@/services/aiBackend';
import { booksApi } from '@/services/api';

import { useAuth } from '@/context/AuthContext';

import { useIssueBook } from '@/hooks/useBorrow';
import { addDays } from 'date-fns';

const VoiceSearch: React.FC = () => {
  const { user } = useAuth();
  const issueBook = useIssueBook();
  const [listening, setListening] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  const toggleListening = () => {
    if (listening) {
      setListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in this browser. Please try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setListening(true);
      setQuery('');
      setAiResult(null);
      toast('🎤 Listening... speak now');
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setListening(false);
      
      let message = `Error: ${event.error}`;
      if (event.error === 'no-speech') {
        message = 'No speech detected. Please try again.';
      } else if (event.error === 'not-allowed') {
        message = 'Microphone permission denied. Please allow access.';
      }
      
      toast.error(message);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      toast.success(`Voice recognized: "${transcript}"`);
      processVoiceCommand(transcript);
    };

    recognition.start();
  };

  const processVoiceCommand = async (text: string) => {
    if (!text.trim()) return;
    setProcessing(true);
    try {
      // 1. Get AI Interpretation
      const result = await processVoiceQuery(text, {
        userId: user?.uid,
        userEmail: user?.email,
        subType: 'voice_query'
      });
      setAiResult(result);
      
      // 2. Perform Real Search from Firestore
      const searchParams = {
        search: result.searchTerms || text,
        category: result.genre,
        limit: 10
      };
      
      const response = await booksApi.getAll(searchParams);
      
      if (response && response.data) {
        setResults(response.data);
        if (response.data.length > 0) {
          toast.success(`Found ${response.data.length} books!`);
        } else {
          toast.error('No matching books found in our database.');
        }
      }
      
      if (result.intent) {
        toast(`AI identified ${result.intent} intent`, { icon: '🤖' });
      }

    } catch (error: any) {
      console.error('Voice processing error:', error);
      toast.error('AI Error: ' + (error?.message || 'Failed to process voice query'));
      
      // Local search fallback if backend fails entirely
      try {
        const fallback = await booksApi.getAll({ search: text, limit: 5 });
        setResults(fallback.data);
      } catch (err) {
        setResults([]);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleBorrow = (bookId: string) => {
    if (!user?.isProfileComplete) {
      toast.error('Please complete your profile to borrow books');
      return;
    }
    
    issueBook.mutate({
      studentId: user.uid,
      bookId,
      dueDate: addDays(new Date(), 14).toISOString(),
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Voice Search" description="Search books using your voice or text" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {/* Search Area */}
        <LibCard className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Search or use voice..." className="w-full pl-9 pr-3 py-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <LibButton onClick={toggleListening} variant={listening ? 'danger' : 'primary'} className="px-4">
              {listening ? <><MicOff className="h-5 w-5" /> <span className="ml-2 hidden sm:inline">Stop</span></> : <><Mic className="h-5 w-5" /> <span className="ml-2 hidden sm:inline">Speak</span></>}
            </LibButton>
          </div>
          {listening && (
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-pulse">
                <Mic className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-sm text-foreground mt-3">Listening...</p>
              <p className="text-xs text-muted-foreground">Say something like "Find algorithms textbook"</p>
            </div>
          )}
          
          {processing && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-spin text-accent" />
                <span>AI is processing your query...</span>
              </div>
            </div>
          )}
          
          {aiResult && (
            <div className="bg-accent/5 rounded-md p-3 border border-accent/10">
              <p className="text-xs font-semibold text-foreground mb-1">AI Interpretation:</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-background rounded">Intent: {aiResult.intent}</span>
                <span className="px-2 py-1 bg-background rounded">Terms: {aiResult.searchTerms}</span>
                {aiResult.genre && <span className="px-2 py-1 bg-background rounded">Genre: {aiResult.genre}</span>}
                <span className="px-2 py-1 bg-background rounded">Confidence: {Math.round(aiResult.confidence * 100)}%</span>
              </div>
            </div>
          )}
        </LibCard>

        {/* Recent Searches */}
        {results.length === 0 && !query && (
          <LibCard className="text-center py-10 bg-secondary/5 border-2 border-dashed border-muted/20">
            <div className="h-12 w-12 bg-secondary/80 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your search history is empty</p>
            <p className="text-[10px] text-muted-foreground mt-2">Try searching for "Machine Learning" or use the mic button!</p>
          </LibCard>
        )}

        {/* Results */}
        {results.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">{results.length} Matches Found</h3>
            {results.map((r) => (
              <LibCard key={r.title} className="flex items-center justify-between group hover:border-accent/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                    <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{r.title}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{r.author} · {r.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <LibBadge variant={r.available ? 'available' : 'issued'}>{r.available ? 'Available' : 'Issued'}</LibBadge>
                  {r.available && (
                    <LibButton 
                      size="sm" 
                      className="h-8 text-[10px]" 
                      onClick={() => handleBorrow(r.id)}
                      loading={issueBook.isPending}
                    >
                      Issue Now
                    </LibButton>
                  )}
                </div>
              </LibCard>
            ))}
          </div>
        ) : query && !listening && (
          <LibCard className="py-20 text-center border-accent/10 bg-gradient-to-t from-accent/5 to-transparent">
            <div className="relative h-16 w-16 mx-auto mb-6">
               <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping" />
               <div className="relative h-16 w-16 bg-secondary rounded-full flex items-center justify-center border border-accent/20">
                  <Search className="h-8 w-8 text-accent/60" />
               </div>
            </div>
            <h4 className="text-sm font-bold text-foreground mb-1 uppercase tracking-widest">No books found for "{query}"</h4>
            <p className="text-xs text-muted-foreground max-w-[250px] mx-auto">Try rephrasing your search or browse our catalog manually.</p>
            <LibButton variant="secondary" size="sm" className="mt-6" onClick={() => (window.location.href = '/student/books')}>
               Browse Full Library
            </LibButton>
          </LibCard>
        )}
      </div>
    </div>
  );
};

export default VoiceSearch;
