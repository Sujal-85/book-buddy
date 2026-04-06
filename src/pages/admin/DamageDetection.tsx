import React, { useState, useEffect } from 'react';
import { Camera, Upload, AlertTriangle, CheckCircle, XCircle, Sparkles, Copy, Check, User, FileText, Search, RefreshCw, BookOpen } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import aiBackend from '@/services/aiBackend';
import { membersApi, booksApi, borrowApi } from '@/services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Assessment {
  id: string;
  title: string;
  student: string;
  condition: string;
  score: number;
  date: string;
  issues: string[];
  notes?: string;
}

const DamageDetection: React.FC = () => {
  const [assessing, setAssessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedBorrowId, setSelectedBorrowId] = useState('');
  const [memberBorrows, setMemberBorrows] = useState<any[]>([]);
  const [visualDescription, setVisualDescription] = useState('');
  const [condition, setCondition] = useState('Good');
  
  const [lastAssessment, setLastAssessment] = useState<Assessment | null>(() => {
    const saved = localStorage.getItem('admin_last_damage_assessment');
    return saved ? JSON.parse(saved) : null;
  });

  const [assessments, setAssessments] = useState<Assessment[]>(() => {
    const saved = localStorage.getItem('admin_damage_assessments');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data } = await membersApi.getAll();
        setMembers(data);
      } catch (err) {
        console.error('Error fetching members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    const fetchBorrows = async () => {
      if (!selectedStudentId) {
        setMemberBorrows([]);
        return;
      }
      try {
        const { data } = await borrowApi.getStudentBorrows(selectedStudentId);
        // Only show active borrows for damage assessment during return/check
        setMemberBorrows(data.filter((b: any) => b.status === 'active'));
      } catch (err) {
        console.error('Error fetching borrows:', err);
      }
    };
    fetchBorrows();
  }, [selectedStudentId]);

  useEffect(() => {
    localStorage.setItem('admin_damage_assessments', JSON.stringify(assessments));
  }, [assessments]);

  useEffect(() => {
    if (lastAssessment) {
      localStorage.setItem('admin_last_damage_assessment', JSON.stringify(lastAssessment));
    }
  }, [lastAssessment]);

  const handleAssessment = async () => {
    if (!visualDescription.trim()) {
      toast.error('Please provide a description of the damage');
      return;
    }
    
    setAssessing(true);
    try {
      const student = members.find(m => m.id === selectedStudentId);
      const studentName = student ? (student.name || student.displayName) : 'Admin (General Check)';
      
      const borrow = memberBorrows.find(b => b.id === selectedBorrowId);

      const result = await aiBackend.detectDamage(
        visualDescription, 
        condition,
        {
          userId: selectedStudentId || 'admin',
          subType: 'condition_assessment',
          prompt: `Assess damage for book: ${borrow?.book?.title || 'Unknown'}`
        }
      );
      
      // Update book condition in database if a book was selected
      if (borrow && borrow.bookId) {
        await booksApi.update(borrow.bookId, {
          condition: result.damageLevel,
          lastDamageAssessment: {
            level: result.damageLevel,
            types: result.damageTypes,
            notes: result.notes,
            date: new Date().toISOString()
          }
        });
      }

      const newAssessment: Assessment = {
        id: Date.now().toString(),
        title: 'Recently Assessed Book',
        student: studentName,
        condition: result.damageLevel.charAt(0).toUpperCase() + result.damageLevel.slice(1),
        score: result.damageLevel === 'none' ? 95 : result.damageLevel === 'minor' ? 75 : result.damageLevel === 'moderate' ? 45 : 20,
        date: new Date().toISOString().split('T')[0],
        issues: result.damageTypes,
        notes: result.notes
      };

      setLastAssessment(newAssessment);
      setAssessments(prev => [newAssessment, ...prev]);
      setVisualDescription('');
      toast.success('AI damage assessment complete!');
    } catch (err) {
      console.error('Assessment error:', err);
      toast.error('Failed to analyze book damage');
    } finally {
      setAssessing(false);
    }
  };

  const getConditionColor = (condition: string) => {
    const c = condition.toLowerCase();
    if (c === 'excellent' || c === 'good' || c === 'none') return 'available';
    if (c === 'fair' || c === 'minor') return 'default';
    return 'issued';
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Assessment copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="AI Damage Detection" description="Assess book condition using AI-powered image analysis" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-10">
        {/* Upload Area & Latest Assessment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LibCard className="h-full">
            <div className="flex flex-col gap-6">
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-accent/10 rounded-lg">
                    <Sparkles className="h-4 w-4 text-accent" />
                 </div>
                 <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Discovery Assessment</h3>
               </div>

               <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <User className="h-3 w-3" /> Assign to Student (Optional)
                    </label>
                    <select 
                      value={selectedStudentId} 
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium appearance-none"
                    >
                      <option value="">System Check (No Student)</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>{m.name || m.displayName}</option>
                      ))}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <BookOpen className="h-3 w-3" /> Select Book from Student Loans
                    </label>
                    <select 
                      value={selectedBorrowId} 
                      onChange={(e) => setSelectedBorrowId(e.target.value)}
                      disabled={!selectedStudentId || memberBorrows.length === 0}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium appearance-none"
                    >
                      <option value="">{selectedStudentId ? (memberBorrows.length > 0 ? 'Select a book...' : 'No active loans') : 'Select student first'}</option>
                      {memberBorrows.map(b => (
                        <option key={b.id} value={b.id}>{b.book?.title}</option>
                      ))}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <FileText className="h-3 w-3" /> Visual Observation Description
                    </label>
                    <textarea 
                      value={visualDescription} 
                      onChange={(e) => setVisualDescription(e.target.value)}
                      placeholder="Describe the condition: torn pages, stains, spine wear, etc."
                      rows={4}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium resize-none shadow-inner"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Original Condition</label>
                    <select 
                      value={condition} 
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium appearance-none"
                    >
                      <option value="New">New / Mint</option>
                      <option value="Good">Good / Used</option>
                      <option value="Fair">Fair / Visible Wear</option>
                      <option value="Poor">Poor / Damaged</option>
                    </select>
                 </div>

                 <LibButton 
                    onClick={handleAssessment} 
                    disabled={assessing} 
                    className="w-full py-7 bg-accent text-white font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-[1.01] transition-all"
                  >
                    {assessing ? <RefreshCw className="h-4 w-4 animate-spin mr-3" /> : <Sparkles className="h-4 w-4 mr-3" />}
                    {assessing ? 'AGENT ANALYZING...' : 'DISPATCH AGENTIC ASSESSMENT'}
                 </LibButton>
               </div>
            </div>
          </LibCard>

          <LibCard className={`transition-all duration-500 ${lastAssessment ? 'opacity-100' : 'opacity-40 grayscale select-none'}`}>
            <h3 className="text-xs font-black text-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Sparkles className="h-3 w-3" /> Evaluation Insight
            </h3>
            {lastAssessment ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black text-foreground">{lastAssessment.title}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{lastAssessment.student}</p>
                  </div>
                   <div className="flex items-center gap-3">
                    <LibBadge variant={getConditionColor(lastAssessment.condition) as any} className="px-3 py-1 text-xs">
                      {lastAssessment.condition}
                    </LibBadge>
                    <button 
                      onClick={() => handleCopy(`Assessment for ${lastAssessment.title}\nCondition: ${lastAssessment.condition}\nNotes: ${lastAssessment.notes}`)}
                      className="p-2 hover:bg-accent/10 rounded-full transition-colors text-accent"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="bg-secondary/30 p-4 rounded-xl border border-accent/20">
                  <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2 font-black">AI Reasoning & Findings</p>
                  <div className="max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-accent/20 prose prose-invert prose-xs leading-relaxed pr-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {lastAssessment.notes || "No detailed notes provided."}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${lastAssessment.score > 80 ? 'bg-green-500' : lastAssessment.score > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${lastAssessment.score}%` }}
                    />
                  </div>
                  <span className="text-sm font-black text-foreground">{lastAssessment.score}% Health</span>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-muted-foreground bg-secondary/5 rounded-xl border border-dashed border-border/50">
                <AlertTriangle className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Awaiting AI Input</p>
              </div>
            )}
          </LibCard>
        </div>

        {/* Recent Assessments */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-[0.15em] px-1">
            <CheckCircle className="h-4 w-4 text-accent" /> Assessment History
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assessments.map((a) => (
              <LibCard key={a.id} className="group hover:border-accent/40 transition-all bg-secondary/5 border-border/40">
                <div className="flex flex-col h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black leading-tight border border-accent/10 ${a.score > 80 ? 'bg-green-500/10 text-green-500' : a.score > 40 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                        <span className="text-lg">{a.score}%</span>
                        <span className="text-[7px] uppercase tracking-tighter opacity-70">Health</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground line-clamp-1">{a.title}</p>
                        <p className="text-[10px] text-muted-foreground font-bold">{a.date}</p>
                      </div>
                    </div>
                    <LibBadge variant={getConditionColor(a.condition) as any} className="border-none px-3">{a.condition}</LibBadge>
                  </div>

                  {a.notes && (
                    <div className="bg-background/40 p-3 rounded-xl border border-border/50 flex-1">
                      <div className="max-h-[80px] overflow-y-auto scrollbar-thin scrollbar-thumb-accent/20 prose prose-invert prose-[11px] leading-relaxed pr-1 font-medium">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {a.notes}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {a.issues.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/30">
                      {a.issues.map((issue) => (
                        <span key={issue} className="text-[9px] uppercase font-black tracking-tight px-3 py-1 rounded bg-red-500/5 text-red-400 border border-red-500/10">
                          {issue}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </LibCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DamageDetection;
