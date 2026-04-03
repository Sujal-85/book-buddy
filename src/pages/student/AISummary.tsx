import React, { useState, useRef } from 'react';
import { FileText, BookOpen, Sparkles, Copy, Type, Upload, AlertCircle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';
import { summarizeText, summarizePDF } from '@/services/aiBackend';

const AISummary: React.FC = () => {
  const [bookTitle, setBookTitle] = useState('');
  const [bookText, setBookText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<null | { title: string; summary: string; type: 'text' | 'pdf'; length: number }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setBookTitle(file.name.replace('.pdf', ''));
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile && !bookText.trim()) {
      toast.error('Please provide text or upload a PDF');
      return;
    }

    setGenerating(true);
    try {
      let result = '';
      if (selectedFile) {
        result = await summarizePDF(selectedFile);
      } else {
        result = await summarizeText(bookText, 1000);
      }

      setSummary({
        title: bookTitle || (selectedFile ? selectedFile.name : 'Untitled Summary'),
        summary: result,
        type: selectedFile ? 'pdf' : 'text',
        length: selectedFile ? selectedFile.size : bookText.length
      });
      toast.success('AI Summary Generated Successfully!');
    } catch (error) {
      console.error('Summary error:', error);
      toast.error('Failed to generate summary. Our backend might be busy.');
    } finally {
      setGenerating(false);
    }
  };

  const clearInputs = () => {
    setBookText('');
    setBookTitle('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSummary(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="AI Knowledge Transformer" description="Convert complex PDFs or long texts into concise, actionable summaries" />
      
      <div className="flex-1 overflow-y-auto space-y-8 pr-1 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <Upload className="h-4 w-4 text-accent" />
              Source Material
            </h3>
            
            <LibCard className="p-6 space-y-6 bg-secondary/5 border-dashed border-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Input Method</p>
                  <LibBadge variant="default" className="text-[8px] opacity-70">Gemini 1.5 Pro Enabled</LibBadge>
                </div>
                
                {/* PDF Upload */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                    selectedFile 
                      ? 'border-accent bg-accent/5 ring-4 ring-accent/10' 
                      : 'border-border/50 hover:border-accent/40 hover:bg-secondary/50'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".pdf" 
                    className="hidden" 
                  />
                  {selectedFile ? (
                    <div className="space-y-2 animate-in zoom-in-95 duration-300">
                      <div className="h-12 w-12 bg-accent rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-accent/20">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-sm font-bold text-foreground truncate max-w-[200px] mx-auto">{selectedFile.name}</p>
                      <p className="text-[10px] font-black text-accent uppercase tracking-tighter">PDF Selected</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="h-12 w-12 bg-secondary rounded-xl flex items-center justify-center mx-auto opacity-50">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground">Upload PDF Document</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Click to browse or drag and drop (Max 10MB)</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]"><span className="bg-card px-3">or paste content</span></div>
                </div>

                {/* Text Area */}
                <div className="space-y-2">
                  <textarea
                    value={bookText}
                    onChange={(e) => {
                      setBookText(e.target.value);
                      if (e.target.value) setSelectedFile(null);
                    }}
                    placeholder="Enter chapter text or paste long form content manually..."
                    rows={8}
                    className="w-full bg-background border border-border/50 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium resize-none shadow-inner"
                  />
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1">
                       <Type className="h-3 w-3" />
                       {bookText.length.toLocaleString()} characters
                    </p>
                    {bookText && (
                      <button onClick={() => setBookText('')} className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1 hover:opacity-70 transition-opacity">
                        <Trash2 className="h-3 w-3" /> Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <LibButton 
                onClick={handleGenerate} 
                loading={generating}
                disabled={generating || (!selectedFile && !bookText.trim())}
                className="w-full py-7 rounded-2xl shadow-xl shadow-accent/20 text-lg font-black tracking-tighter"
              >
                {generating ? 'Processing Material...' : 'Synthesize Key Insights'}
              </LibButton>
            </LibCard>

            <div className="flex items-center gap-3 p-4 bg-accent/5 rounded-2xl border border-accent/10">
              <Sparkles className="h-5 w-5 text-accent shrink-0 animate-pulse" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
                Our AI uses contextual mapping to identify core arguments, key vocabulary, and actionable takeaways from your book material.
              </p>
            </div>
          </div>

          {/* Result Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent" />
              Synthesized Summary
            </h3>

            {summary ? (
              <LibCard className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-500 border-accent/30 bg-accent/5 ring-1 ring-accent/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <LibBadge variant="available">Synthetic Brain v3</LibBadge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-accent/20 rounded-lg flex items-center justify-center border border-accent/20">
                      <Sparkles className="h-4 w-4 text-accent" />
                    </div>
                    <h2 className="text-xl font-black text-foreground tracking-tight line-clamp-2">{summary.title}</h2>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-11">
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Full Context Map</span>
                    <span className="opacity-30">|</span>
                    <span>{summary.type === 'pdf' ? (summary.length / 1024).toFixed(1) + ' KB' : summary.length + ' Chars'}</span>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none text-foreground leading-relaxed font-medium bg-white/50 dark:bg-black/20 p-6 rounded-3xl border border-white/20 shadow-inner">
                   {summary.summary.split('\n').map((para, i) => (
                     <p key={i} className={para.startsWith('-') || para.startsWith('*') ? 'pl-4 -indent-4 mb-2' : 'mb-4'}>
                       {para}
                     </p>
                   ))}
                </div>

                <div className="flex gap-3">
                   <LibButton 
                    variant="ghost" 
                    onClick={() => { navigator.clipboard.writeText(summary.summary); toast.success('Copied to clipboard!'); }}
                    className="flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest gap-2"
                   >
                     <Copy className="h-4 w-4" /> Copy Insight
                   </LibButton>
                   <LibButton 
                    variant="secondary" 
                    onClick={clearInputs}
                    className="py-4 px-6 rounded-xl text-xs font-black uppercase tracking-widest"
                   >
                     Reset
                   </LibButton>
                </div>
              </LibCard>
            ) : generating ? (
              <LibCard className="p-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <div className="h-24 w-24 border-4 border-accent/10 border-t-accent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-accent animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-foreground uppercase tracking-tight">Transformer Active</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Analyzing semantic structure and mapping key conceptual relationships. This usually takes 15-30 seconds depending on text volume.
                  </p>
                </div>
                <div className="w-full max-w-[200px] h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent animate-progress" style={{ width: '60%' }} />
                </div>
              </LibCard>
            ) : (
              <LibCard className="p-16 text-center space-y-4 border-dashed border-border/50 bg-secondary/5 rounded-3xl">
                <div className="h-20 w-20 bg-muted/10 rounded-3xl rotate-12 flex items-center justify-center mx-auto opacity-30 border-2 border-border/50">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em]">Synthesizer Idle</p>
                  <p className="text-[10px] text-muted-foreground/60 max-w-[240px] mx-auto font-medium">Your knowledge takeaways will appear here once you provide a source material on the left.</p>
                </div>
              </LibCard>
            )}

            {/* AI Capability Badges */}
            <div className="pt-4 flex flex-wrap gap-2 justify-center">
               <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest border border-border/30 px-3 py-1 rounded-full">NLP Analysis</span>
               <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest border border-border/30 px-3 py-1 rounded-full">Deep Learning</span>
               <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest border border-border/30 px-3 py-1 rounded-full">Book Contextualizer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISummary;
