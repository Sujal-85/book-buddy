import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Cpu, 
  RefreshCw, 
  ChevronDown, 
  ExternalLink,
  Brain,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  FileText,
  Mic,
  Bell,
  TrendingUp
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import { getAILogs } from '@/services/aiBackend';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

interface AILog {
  id: string;
  type: string;
  subType: string;
  prompt: string;
  result: any;
  userId: string;
  userEmail: string;
  timestamp: any;
  model: string;
}

const AIAudit: React.FC = () => {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAILogs(100);
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching AI logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || log.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'cataloging': return <Brain className="h-4 w-4 text-purple-400" />;
      case 'damage_detection': return <ShieldCheck className="h-4 w-4 text-red-400" />;
      case 'fine_calculator': return <AlertCircle className="h-4 w-4 text-orange-400" />;
      case 'analytics': return <Cpu className="h-4 w-4 text-blue-400" />;
      case 'summarization':
      case 'summarize': return <FileText className="h-4 w-4 text-green-400" />;
      case 'recommendations': return <Sparkles className="h-4 w-4 text-amber-400" />;
      case 'study':
      case 'student_assistance': return <Brain className="h-4 w-4 text-pink-400" />;
      case 'voice-query': return <Mic className="h-4 w-4 text-cyan-400" />;
      case 'notifications': return <Bell className="h-4 w-4 text-yellow-400" />;
      case 'predictions': return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      default: return <History className="h-4 w-4 text-accent" />;
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'N/A';
    // Handle both Firestore Timestamp and JS Date
    const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return format(date, 'MMM dd, HH:mm:ss');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader 
        title="AI Audit Trail" 
        description="Monitor system intelligence and agentic interactions across the platform" 
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs by user, type, or subtype..."
              className="w-full bg-secondary/50 border border-border/50 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              className="bg-secondary/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none pr-10 relative cursor-pointer"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Interactions</option>
              <option value="cataloging">Cataloging</option>
              <option value="damage_detection">Damage Detection</option>
              <option value="fine_calculator">Fine Calculation</option>
              <option value="analytics">Analytics & Profiling</option>
              <option value="summarization">Summarization</option>
              <option value="recommendations">Recommendations</option>
              <option value="study">Study Companion</option>
              <option value="student_assistance">Reading Goals</option>
              <option value="predictions">Availability Prediction</option>
              <option value="notifications">Smart Notifications</option>
              <option value="voice-query">Voice Commands</option>
              <option value="analyze-reviews">Review Analysis</option>
            </select>
            
            <LibButton 
              variant="secondary" 
              size="sm" 
              onClick={fetchLogs}
              disabled={loading}
              className="rounded-xl"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </LibButton>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-secondary/20 rounded-2xl border border-border/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b border-border/40">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Integration</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Details</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4 h-16 bg-white/5 opacity-20"></td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <History className="h-8 w-8 opacity-20" />
                        <p className="text-sm font-medium">No AI interactions found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr className={`hover:bg-accent/5 transition-colors cursor-pointer group ${expandedId === log.id ? 'bg-accent/5' : ''}`} onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">
                              {formatTimestamp(log.timestamp)}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                              {log.model || 'Gemini 1.5'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-lg border border-border/50">
                              {getLogIcon(log.type)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-foreground capitalize">{log.type.replace('_', ' ')}</span>
                              <span className="text-xs text-muted-foreground italic">{log.subType}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center border border-accent/40">
                              <User className="h-3 w-3 text-accent" />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground truncate max-w-[150px]">{log.userEmail}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="max-w-xs truncate text-xs text-muted-foreground font-medium">
                              {log.prompt || 'No prompt recorded'}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${expandedId === log.id ? 'rotate-180 text-accent' : ''}`} />
                        </td>
                      </tr>
                      {expandedId === log.id && (
                        <tr className="bg-accent/5 border-l-4 border-l-accent">
                          <td colSpan={5} className="px-6 py-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                                  <Brain className="h-3 w-3" /> Input Prompt
                                </h5>
                                <div className="bg-background/50 p-4 rounded-xl border border-border/50 text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                                  {log.prompt}
                                </div>
                              </div>
                              <div className="space-y-4">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                                  <Sparkles className="h-3 w-3" /> AI Response
                                </h5>
                                <div className="bg-background/80 p-4 rounded-xl border border-accent/20 text-xs text-foreground prose prose-invert prose-xs max-w-none">
                                   <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {typeof log.result === 'string' ? log.result : JSON.stringify(log.result, null, 2)}
                                   </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAudit;
