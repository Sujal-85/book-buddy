import React, { useState, useMemo } from 'react';
import { Target, Trophy, Flame, BookOpen, CheckCircle, Plus, Loader2, X, Sparkles, Brain } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi } from '@/services/api';
import { suggestReadingGoals } from '@/services/aiBackend';

const ReadingGoals: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target: 5, category: 'General' });
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  const { data: goalsData, isLoading: isGoalsLoading } = useQuery({
    queryKey: ['reading-goals', user?.uid],
    queryFn: () => goalsApi.getGoals(user?.uid || ''),
    enabled: !!user?.uid,
  });

  const { data: achievementsData } = useQuery({
    queryKey: ['achievements', user?.uid],
    queryFn: () => goalsApi.getAchievements(user?.uid || ''),
    enabled: !!user?.uid,
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: any) => goalsApi.create(user?.uid || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-goals', user?.uid] });
      toast.success('Goal set successfully!');
      setShowGoalForm(false);
    },
    onError: () => toast.error('Failed to create goal'),
  });

  const { data: borrowData } = useQuery({
    queryKey: ['borrow-history', user?.uid],
    queryFn: () => import('@/services/api').then(m => m.borrowApi.getStudentBorrows(user?.uid || '')),
    enabled: !!user?.uid,
  });

  const history = borrowData?.data || [];
  const completedBooks = history.filter((b: any) => b.status === 'returned').length;
  const currentYear = new Date().getFullYear();
  const yearBooks = history.filter((b: any) => {
    const date = b.issuedAt?.toDate ? b.issuedAt.toDate() : new Date(b.issuedAt);
    return date.getFullYear() === currentYear && b.status === 'returned';
  }).length;

  const goals = goalsData?.data || [];
  const achievements = useMemo(() => {
    const defaultAchievements = [
      { id: '1', name: 'Bookworm', icon: '📚', description: 'Read 10 books', earned: completedBooks >= 10 },
      { id: '2', name: 'Speed Reader', icon: '⚡', description: 'Return a book within 3 days', earned: history.some((b: any) => {
        if (!b.returnedAt || !b.issuedAt) return false;
        const start = b.issuedAt?.toDate ? b.issuedAt.toDate() : new Date(b.issuedAt);
        const end = b.returnedAt?.toDate ? b.returnedAt.toDate() : new Date(b.returnedAt);
        return (end.getTime() - start.getTime()) < (3 * 24 * 60 * 60 * 1000);
      }) },
      { id: '3', name: 'Explorer', icon: '🧭', description: 'Borrow from 5 categories', earned: new Set(history.map((b: any) => b.book?.category)).size >= 5 },
      { id: '4', name: 'Scholar', icon: '🎓', description: 'Read 25 books', earned: completedBooks >= 25 },
      { id: '5', name: 'Librarian Pick', icon: '⭐', description: 'Read 50 books', earned: completedBooks >= 50 },
      { id: '6', name: 'Genre Master', icon: '🏆', description: 'Read from 10 categories', earned: new Set(history.map((b: any) => b.book?.category)).size >= 10 },
    ];
    return achievementsData?.data?.length ? achievementsData.data : defaultAchievements;
  }, [completedBooks, history, achievementsData]);

  const handleCreateGoal = (e?: React.FormEvent, manualGoal?: any) => {
    if (e) e.preventDefault();
    const goalToCreate = manualGoal || {
      title: newGoal.title,
      target: Number(newGoal.target),
      progress: 0,
      category: newGoal.category,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    };

    if (!goalToCreate.title) return toast.error('Please enter a goal title');
    
    createGoalMutation.mutate(goalToCreate);
  };

  const handleAISuggest = async () => {
    if (!user) return;
    setIsSuggesting(true);
    try {
      const studentData = {
        id: user.uid,
        name: user.name,
        history: history.map((b: any) => ({
          title: b.book?.title,
          category: b.book?.category,
          status: b.status
        })),
        completedCount: completedBooks
      };

      const suggestions = await suggestReadingGoals(studentData, {
        userId: user.uid,
        userEmail: user.email,
        subType: 'goal_discovery'
      });
      setAiSuggestions(suggestions);
      toast.success('AI Goal Assistant: Recommendations ready!');
    } catch (err) {
      console.error('AI suggest error:', err);
      toast.error('Failed to get suggestions');
    } finally {
      setIsSuggesting(false);
    }
  };

  const adoptGoal = (suggestion: any) => {
    handleCreateGoal(undefined, {
      title: suggestion.title,
      target: suggestion.target,
      progress: 0,
      category: suggestion.category || 'General',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    });
    setAiSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
  };

  if (isGoalsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Reading Goals & Achievements" description="Set targets, track progress and earn rewards" />
      
      <div className="flex-1 overflow-y-auto space-y-8 pr-1 pb-10">
        {/* Streak & Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LibCard className="md:col-span-2 flex items-center gap-6 bg-gradient-to-r from-orange-500/10 to-transparent border-orange-500/20">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30 shadow-xl">
                <Flame className="h-8 w-8 text-orange-500 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-card uppercase">Hot</div>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground tracking-tighter">7 Day Streak</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-70">Keep it up! You're in the top 5% of readers this week. 🔥</p>
            </div>
          </LibCard>

          <LibCard className="flex flex-col justify-center items-center text-center bg-accent/5 border-accent/10">
            <div className="text-3xl font-black text-accent tracking-tighter mb-0.5">{yearBooks}</div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Books Read This Year</p>
          </LibCard>
        </div>

        {/* Goals Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              Active Goals
            </h3>
            <div className="flex gap-2">
              <LibButton 
                size="sm" 
                variant="ghost"
                className="h-8 text-[10px] gap-2 text-accent border-accent/20 hover:bg-accent/5" 
                onClick={handleAISuggest}
                disabled={isSuggesting}
              >
                {isSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                AI Suggestions
              </LibButton>
              <LibButton 
                size="sm" 
                variant={showGoalForm ? 'ghost' : 'secondary'} 
                className="h-8 text-[10px]" 
                onClick={() => setShowGoalForm(!showGoalForm)}
              >
                {showGoalForm ? 'Cancel' : '+ Set New Goal'}
              </LibButton>
            </div>
          </div>

          {aiSuggestions.length > 0 && (
            <div className="mb-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] flex items-center gap-2">
                  <Brain className="h-3 w-3" /> Recommended by AI Assistant
                </p>
                <button onClick={() => setAiSuggestions([])} className="text-[10px] text-muted-foreground hover:text-foreground">Dismiss</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiSuggestions.map((s, i) => (
                  <LibCard key={i} className="p-4 border-accent/30 bg-accent/5 flex flex-col justify-between group hover:scale-[1.02] transition-all">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <LibBadge variant="default" className="text-[8px] uppercase tracking-tighter border-accent/20 text-accent bg-accent/5">{s.difficulty || 'Personalized'}</LibBadge>
                        <span className="text-[10px] font-black text-foreground/40">{s.target} Books</span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground mb-1 group-hover:text-accent transition-colors">{s.title}</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{s.description}</p>
                    </div>
                    <LibButton 
                      size="sm" 
                      variant="ghost" 
                      className="mt-3 h-7 text-[10px] w-full border-accent/20 hover:bg-accent hover:text-white"
                      onClick={() => adoptGoal(s)}
                    >
                      Adopt Goal
                    </LibButton>
                  </LibCard>
                ))}
              </div>
            </div>
          )}

          {showGoalForm && (
            <LibCard className="mb-6 border-accent/30 bg-accent/5 animate-in slide-in-from-top-2 duration-300">
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Goal Title</label>
                    <input 
                      value={newGoal.title}
                      onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                      placeholder="e.g. Read 5 Physics books before finals"
                      className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Target Count</label>
                    <input 
                      type="number"
                      value={newGoal.target}
                      onChange={e => setNewGoal({...newGoal, target: parseInt(e.target.value) || 1})}
                      min="1"
                      className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <LibButton type="submit" size="sm" loading={createGoalMutation.isPending} className="px-8 shadow-xl shadow-accent/20">
                    Create Goal
                  </LibButton>
                </div>
              </form>
            </LibCard>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.length > 0 ? (
              goals.map((g: any) => (
                <LibCard key={g.id} className="p-5 group hover:border-accent/30 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 group-hover:bg-accent group-hover:text-white transition-all duration-500">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground line-clamp-1">{g.title}</h4>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">{g.category}</p>
                      </div>
                    </div>
                    <LibBadge variant={g.progress >= g.target ? 'available' : 'default'} className="text-[10px] font-black">
                      {Math.round((g.progress / g.target) * 100)}%
                    </LibBadge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-0.5">
                      <span>Progress</span>
                      <span>{g.progress} / {g.target} books</span>
                    </div>
                    <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden shadow-inner border border-border/10 p-[1px]">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                          g.progress >= g.target ? 'bg-green-500' : 'bg-gradient-to-r from-accent to-accent-foreground'
                        }`} 
                        style={{ width: `${Math.min((g.progress / g.target) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>
                  {g.progress >= g.target && (
                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Goal Accomplished!
                    </div>
                  )}
                </LibCard>
              ))
            ) : (
              <LibCard className="md:col-span-2 py-16 flex flex-col items-center justify-center text-center space-y-4 bg-secondary/5 border-dashed border-muted/50 rounded-2xl">
                <div className="h-16 w-16 bg-muted/10 rounded-full flex items-center justify-center shadow-inner">
                  <Target className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <p className="text-base font-bold text-foreground uppercase tracking-widest">Set your first goal</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Reading goals help you stay focused and build a consistent reading habit. Challenge yourself today!</p>
                </div>
                <LibButton size="sm" onClick={() => setShowGoalForm(true)} className="px-8 mt-2">
                  Get Started
                </LibButton>
              </LibCard>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-6 uppercase tracking-widest flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            Achievements
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {achievements.map((a: any) => (
              <LibCard 
                key={a.id} 
                className={`text-center py-6 px-4 space-y-3 transition-all duration-500 relative overflow-hidden group ${
                  !a.earned 
                    ? 'opacity-40 grayscale hover:grayscale-0 hover:opacity-70' 
                    : 'border-accent/40 bg-accent/5 ring-1 ring-accent/20'
                }`}
              >
                {a.earned && <div className="absolute inset-0 bg-gradient-to-t from-accent/10 to-transparent pointer-events-none" />}
                <div className={`text-4xl filter transition-transform duration-500 group-hover:scale-125 ${a.earned ? 'drop-shadow-lg' : 'drop-shadow-none'}`}>
                  {a.icon}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-foreground uppercase tracking-tighter leading-none">{a.name}</p>
                  <p className="text-[9px] text-muted-foreground leading-tight px-1 font-medium">{a.description}</p>
                </div>
                {a.earned && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 fill-green-500/20" />
                  </div>
                )}
              </LibCard>
            ))}
          </div>
        </div>

        {/* Community Challenges Shell */}
        <div className="pt-8 border-t border-border/50">
          <h3 className="text-sm font-bold text-foreground mb-6 uppercase tracking-widest">Global Challenges</h3>
          <LibCard className="p-8 text-center bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/10">
            <Trophy className="h-12 w-12 text-indigo-500/40 mx-auto mb-4" />
            <h4 className="text-base font-black text-foreground uppercase tracking-widest mb-2">Summer Reading Blast 2025</h4>
            <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">Join 2,400+ students in our biggest reading competition yet. Top contributors get exclusive library badges & early access to new releases.</p>
            <div className="flex justify-center gap-3">
              <LibButton variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-black tracking-widest bg-accent/5 hover:bg-accent/10">View Details</LibButton>
              <LibButton variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-700 border-none shadow-xl shadow-indigo-500/20 px-8">
                Join Global Race
              </LibButton>
            </div>
          </LibCard>
        </div>
      </div>
    </div>
  );
};

export default ReadingGoals;
