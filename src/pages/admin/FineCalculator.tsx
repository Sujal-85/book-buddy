import React, { useState, useEffect } from 'react';
import { Calculator, Calendar, Clock, IndianRupee, History as HistoryIcon, Sparkles, RefreshCw, Search, Copy, Check, User, FileText } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import aiBackend from '@/services/aiBackend';
import { membersApi, borrowApi, settingsApi } from '@/services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Timestamp } from 'firebase/firestore';

interface HistoryItem {
  id: string;
  student: string;
  book: string;
  daysLate: number;
  condition: string;
  fine: number;
  date: string;
}

const fineRules = [
  { period: '1-7 days', rate: '₹5/day', description: 'Standard overdue fine' },
  { period: '8-14 days', rate: '₹7/day', description: 'Extended overdue fine' },
  { period: '15-30 days', rate: '₹10/day', description: 'Long overdue fine' },
  { period: '30+ days', rate: 'Book replacement cost', description: 'Lost book charge applies' },
];

const FineCalculator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [copied, setCopied] = useState(false);
  const [finePerDay, setFinePerDay] = useState(5);
  
  // Real Data State
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberBorrows, setMemberBorrows] = useState<any[]>([]);
  const [selectedBorrowId, setSelectedBorrowId] = useState('');
  
  const [formData, setFormData] = useState({
    daysLate: '0',
    condition: 'good',
    originalPrice: '0',
    membershipType: 'regular'
  });

  const [result, setResult] = useState<{ fine: number; breakdown: string } | null>(() => {
    const saved = localStorage.getItem('admin_last_fine_result');
    return saved ? JSON.parse(saved) : null;
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('admin_fine_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingInitial(true);
        const [membersRes, settingsRes] = await Promise.all([
          membersApi.getAll(),
          settingsApi.get()
        ]);
        setMembers(membersRes.data);
        if (settingsRes.data?.finePerDay) {
          setFinePerDay(Number(settingsRes.data.finePerDay));
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchBorrows = async () => {
      if (!selectedMemberId) {
        setMemberBorrows([]);
        return;
      }
      try {
        const { data } = await borrowApi.getStudentBorrows(selectedMemberId);
        // Filter for overdue or likely overdue books (active status)
        const active = data.filter((b: any) => b.status === 'active');
        setMemberBorrows(active);
      } catch (err) {
        console.error('Error fetching student borrows:', err);
      }
    };
    fetchBorrows();
  }, [selectedMemberId]);

  useEffect(() => {
    if (selectedBorrowId) {
      const borrow = memberBorrows.find(b => b.id === selectedBorrowId);
      if (borrow) {
        // Calculate days late
        let dueDate: Date;
        if (borrow.dueDate instanceof Timestamp) {
          dueDate = borrow.dueDate.toDate();
        } else if (typeof borrow.dueDate === 'string') {
          dueDate = new Date(borrow.dueDate);
        } else {
          dueDate = new Date();
        }
        
        const now = new Date();
        const diffTime = now.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        setFormData(prev => ({
          ...prev,
          daysLate: Math.max(0, diffDays).toString(),
          originalPrice: (borrow.book?.price || 500).toString()
        }));
      }
    }
  }, [selectedBorrowId, memberBorrows]);

  useEffect(() => {
    if (result) {
      localStorage.setItem('admin_last_fine_result', JSON.stringify(result));
    }
  }, [result]);

  useEffect(() => {
    localStorage.setItem('admin_fine_history', JSON.stringify(history));
  }, [history]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Calculation details copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCalculate = async () => {
    const selectedMember = members.find(m => m.id === selectedMemberId);
    const selectedBorrow = memberBorrows.find(b => b.id === selectedBorrowId);
    
    setLoading(true);
    try {
      const resp = await aiBackend.calculateFine(
        Number(formData.daysLate),
        Number(formData.originalPrice),
        formData.condition,
        formData.membershipType,
        finePerDay
      );
      
      // Sanitize fine value by removing non-numeric characters (like currency symbols)
      const fineValue = Number(String(resp.totalFine || 0).replace(/[^\d.]/g, '')) || 0;

      setResult({
        fine: fineValue,
        breakdown: resp.reasoning
      });

      // Update history
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        student: selectedMember?.name || 'Walk-in Student',
        book: selectedBorrow?.book?.title || 'Standard Library Item',
        daysLate: Number(formData.daysLate),
        condition: formData.condition,
        fine: fineValue,
        date: new Date().toISOString().split('T')[0]
      };
      
      const newHistory = [newItem, ...history.slice(0, 4)];
      setHistory(newHistory);
      localStorage.setItem('admin_fine_history', JSON.stringify(newHistory));
      toast.success('Fine calculated successfully');
    } catch (err) {
      console.error('Fine calculation error:', err);
      toast.error('Failed to calculate fine');
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async () => {
    if (!selectedBorrowId || !result) return;
    
    setLoading(true);
    try {
      const borrow = memberBorrows.find(b => b.id === selectedBorrowId);
      if (!borrow) throw new Error('Borrow record not found');

      // 1. Mark book as returned in the database
      await borrowApi.returnBook(selectedBorrowId, borrow.bookId);
      
      // 2. Update the borrow record with the fine details if your schema supports it
      // For now, we'll just consider the book returned.
      
      toast.success(`Fine of ₹${result.fine} settled and book returned!`);
      
      // 3. Clear selection and results
      setSelectedBorrowId('');
      setResult(null);
      
      // 4. Refresh data
      const { data } = await borrowApi.getStudentBorrows(selectedMemberId);
      setMemberBorrows(data.filter((b: any) => b.status === 'active'));
      
    } catch (err) {
      console.error('Settle error:', err);
      toast.error('Failed to settle dues');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Smart Fine Calculator" description="AI-based fine estimation considering wear, tear, and late duration" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-10">
        
        {/* Statistics & Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <LibCard className="lg:col-span-1 flex flex-col justify-center items-center p-4 bg-accent/5 border-accent/20">
            <IndianRupee className="h-8 w-8 text-accent mb-2" />
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Calculated Today</p>
            <p className="text-2xl font-black text-foreground">₹{history.reduce((sum, item) => sum + (Number(item.fine) || 0), 0)}</p>
          </LibCard>
          
          <LibCard className="lg:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {fineRules.map((rule) => (
                <div key={rule.period} className="space-y-1">
                  <p className="text-[10px] font-bold text-accent uppercase tracking-tighter">{rule.period}</p>
                  <p className="text-sm font-black text-foreground">{rule.rate}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{rule.description}</p>
                </div>
              ))}
            </div>
          </LibCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calculator Form */}
          <div className="lg:col-span-2 space-y-6">
            <LibCard>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <User className="h-3 w-3 text-accent" /> Select Student
                    </label>
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                      <select 
                        value={selectedMemberId}
                        onChange={(e) => {
                          setSelectedMemberId(e.target.value);
                          setSelectedBorrowId('');
                        }}
                        className="w-full bg-secondary/40 border border-accent/20 rounded-lg pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none cursor-pointer hover:bg-secondary/60"
                        disabled={loadingInitial}
                      >
                        <option value="">Choose a student...</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.name || m.displayName} ({m.email?.split('@')[0]})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <FileText className="h-3 w-3 text-accent" /> Overdue Item
                    </label>
                    <select 
                      value={selectedBorrowId}
                      onChange={(e) => setSelectedBorrowId(e.target.value)}
                      className="w-full bg-secondary/40 border border-accent/20 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none cursor-pointer hover:bg-secondary/60"
                      disabled={!selectedMemberId || memberBorrows.length === 0}
                    >
                      <option value="">{selectedMemberId ? (memberBorrows.length > 0 ? 'Select a book...' : 'No active loans found') : 'Select student first'}</option>
                      {memberBorrows.map(b => (
                        <option key={b.id} value={b.id}>{b.book?.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      Days Overdue {formData.daysLate !== '0' && <LibBadge variant="default" className="ml-2 text-[8px] bg-accent/5 text-accent border border-accent/20">AUTO-DETECTED</LibBadge>}
                    </label>
                    <div className="relative group">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                      <input 
                        type="number" 
                        value={formData.daysLate}
                        onChange={(e) => setFormData({...formData, daysLate: e.target.value})}
                        className="w-full bg-secondary/20 border border-border rounded-lg pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      Original Value (₹) {selectedBorrowId && <LibBadge variant="default" className="ml-2 text-[8px] bg-accent/5 text-accent border border-accent/20">FROM DATABASE</LibBadge>}
                    </label>
                    <div className="relative group">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                      <input 
                        type="number" 
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                        className="w-full bg-secondary/20 border border-border rounded-lg pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Book Condition</label>
                    <select 
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                      className="w-full bg-secondary/40 border border-accent/20 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none cursor-pointer hover:bg-secondary/60"
                    >
                      <option value="excellent">Excellent / New</option>
                      <option value="good">Good / Used</option>
                      <option value="fair">Fair / Visible Wear</option>
                      <option value="poor">Poor / Damaged</option>
                      <option value="damaged">Scrapped / Lost</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Membership Tier</label>
                    <select 
                      value={formData.membershipType}
                      onChange={(e) => setFormData({...formData, membershipType: e.target.value})}
                      className="w-full bg-secondary/40 border border-accent/20 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none cursor-pointer hover:bg-secondary/60"
                    >
                      <option value="regular">Regular Member</option>
                      <option value="premium">Premium (+50% Fine Waiver)</option>
                      <option value="faculty">Academic Faculty (Standard)</option>
                    </select>
                  </div>
                </div>
                <LibButton 
                  onClick={handleCalculate} 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-7 bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  <span className="font-bold text-base">{loading ? 'AI AGENT ANALYZING...' : 'RUN AI SMART CALCULATION'}</span>
                </LibButton>
              </div>
            </LibCard>

            {result && (
              <LibCard className="border-accent/50 bg-accent/5 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="h-24 w-24 text-accent" />
                </div>
                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                  <div className="flex flex-col items-center justify-center p-8 bg-background/50 rounded-2xl border border-accent/20 shadow-inner min-w-[180px]">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-2">Final Penalty</p>
                    <p className="text-5xl font-black text-foreground tabular-nums">₹{result.fine}</p>
                    <LibBadge variant="default" className="mt-4 bg-accent/20 text-accent border-none rounded-md px-3">AI VERIFIED</LibBadge>
                  </div>
                  <div className="flex-1 py-2">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-wider">
                        <Calculator className="h-4 w-4 text-accent" /> Logic Breakdown
                      </h4>
                      <button 
                        onClick={() => handleCopy(`Fine Calculation\nTotal Fine: ₹${result.fine}\nBreakdown: ${result.breakdown}`)}
                        className="p-2 hover:bg-accent/10 rounded-full transition-colors text-accent"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-xl border border-border/50 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-accent/20 prose prose-invert prose-xs">
                      <div className="text-xs text-muted-foreground leading-relaxed font-medium">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {result.breakdown}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <LibButton 
                        size="sm" 
                        onClick={handleSettle}
                        disabled={loading}
                        className="px-6 bg-foreground text-background hover:bg-foreground/90 font-bold"
                      >
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                        SETTLE DUES NOW
                      </LibButton>
                      <LibButton variant="ghost" size="sm" className="font-bold border-2 transition-colors hover:bg-secondary">SEND TO STUDENT PORTAL</LibButton>
                    </div>
                  </div>
                </div>
              </LibCard>
            )}
          </div>

          {/* History Sidebar */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 px-1 uppercase tracking-widest">
              <HistoryIcon className="h-5 w-5 text-accent" /> Audit History
            </h3>
            <div className="space-y-3">
              {history.map((h) => (
                <LibCard key={h.id} className="p-4 hover:translate-x-1 transition-transform border-l-4 border-l-accent/40">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-black text-foreground uppercase tracking-tight">{h.book}</p>
                      <p className="text-[10px] text-muted-foreground font-bold">{h.student}</p>
                    </div>
                    <p className="text-sm font-black text-accent">₹{h.fine}</p>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground mt-4 pt-3 border-t border-border/50 uppercase tracking-tighter">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {h.date}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {h.daysLate}d LATE</span>
                  </div>
                </LibCard>
              ))}
              <LibButton variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent">
                Download Comprehensive Audit Log (PDF)
              </LibButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FineCalculator;
