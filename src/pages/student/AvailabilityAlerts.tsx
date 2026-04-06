import React, { useState, useMemo } from 'react';
import { Bell, BookOpen, CheckCircle, Search, Trash2, Clock, Loader2, Sparkles } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi, borrowApi } from '@/services/api';
import { useBooks } from '@/hooks/useBooks';
import { predictAvailability } from '@/services/aiBackend';

import { useIssueBook } from '@/hooks/useBorrow';
import { addDays } from 'date-fns';

const AvailabilityAlerts: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const issueBook = useIssueBook();
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [isPredicting, setIsPredicting] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Record<string, any>>({});

  const { data: allBooks = [] } = useBooks();

  const { data: alertsData, isLoading: isAlertsLoading } = useQuery({
    queryKey: ['availability-alerts', user?.uid],
    queryFn: () => alertsApi.get(user?.uid || ''),
    enabled: !!user?.uid,
  });

  const alerts = alertsData?.data || [];

  const filteredBooks = useMemo(() => {
    if (!bookSearch.trim()) return [];
    const s = bookSearch.toLowerCase();
    return allBooks
      .filter(b => !b.available && (b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s)))
      .filter(b => !alerts.some((a: any) => a.bookId === b.id))
      .slice(0, 5);
  }, [allBooks, bookSearch, alerts]);

  const createAlertMutation = useMutation({
    mutationFn: (bookId: string) => alertsApi.create(user?.uid || '', bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-alerts'] });
      setBookSearch('');
      setSelectedBook(null);
      toast.success('Alert set! We\'ll notify you when available.');
    },
    onError: () => toast.error('Failed to set alert')
  });

  const removeAlertMutation = useMutation({
    mutationFn: (id: string) => alertsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-alerts'] });
      toast.success('Alert removed');
    },
    onError: () => toast.error('Failed to remove alert')
  });

  const handlePredict = async (alert: any) => {
    setIsPredicting(alert.id);
    try {
      // Get all active borrows for this book to see queue length
      const response = await predictAvailability(alert.book, 0, {
        userId: user?.uid,
        subType: 'availability_check'
      });
      setPredictions(prev => ({ ...prev, [alert.id]: response }));
    } catch (err) {
      console.error('Prediction error:', err);
      toast.error('Could not get AI prediction');
    } finally {
      setIsPredicting(null);
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

  const notifications: any[] = [];

  if (isAlertsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Availability Alerts" description="Get notified when high-demand books return to the catalog" />
      
      <div className="flex-1 overflow-y-auto space-y-8 pr-1 pb-10">
        {/* Set Alert */}
        <LibCard className="p-6 border-accent/20 bg-accent/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <Bell className="h-4 w-4 text-accent" /> Track Unavailable Book
            </h3>
            <LibBadge variant="default" className="text-[9px] bg-accent/10 text-accent border-accent/20">AI PREDICTION READY</LibBadge>
          </div>
          
          <div className="relative">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder="Search for a book currently on loan..." 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" 
                />
              </div>
              <LibButton 
                disabled={!selectedBook || createAlertMutation.isPending}
                loading={createAlertMutation.isPending}
                onClick={() => selectedBook && createAlertMutation.mutate(selectedBook.id)}
                className="px-8 rounded-xl"
              >
                Set Alert
              </LibButton>
            </div>

            {filteredBooks.length > 0 && !selectedBook && (
              <div className="absolute w-full mt-2 bg-card border border-border rounded-xl z-20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {filteredBooks.map((b) => (
                  <button 
                    key={b.id} 
                    onClick={() => { setSelectedBook(b); setBookSearch(b.title); }} 
                    className="w-full text-left px-4 py-3 hover:bg-secondary flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-6 bg-secondary rounded flex items-center justify-center">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">{b.title}</p>
                        <p className="text-[10px] text-muted-foreground">by {b.author}</p>
                      </div>
                    </div>
                    <LibBadge variant="issued" className="text-[8px] uppercase">Checked Out</LibBadge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </LibCard>

        {/* Active Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" /> Active Watchlist
            </h3>
            <span className="text-[10px] font-black text-muted-foreground uppercase">{alerts.length} Tracked</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {alerts.length > 0 ? (
              alerts.map((a: any) => {
                const isAvailable = a.book?.available;
                const prediction = predictions[a.id];

                return (
                  <LibCard key={a.id} className={`p-4 transition-all duration-300 ${isAvailable ? 'border-green-500/50 bg-green-500/5 ring-2 ring-green-500/10' : 'hover:border-accent/30'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isAvailable ? 'bg-green-500/20 text-green-600' : 'bg-secondary text-muted-foreground'}`}>
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-black text-foreground tracking-tight">{a.book?.title}</p>
                          <p className="text-xs text-muted-foreground font-medium mb-1">by {a.book?.author}</p>
                          <div className="flex items-center gap-2">
                            {isAvailable ? (
                              <LibBadge variant="available" className="text-[9px] uppercase font-black">Ready for Pickup</LibBadge>
                            ) : (
                              <LibBadge variant="pending" className="text-[9px] uppercase font-black">In Queue</LibBadge>
                            )}
                            {prediction && (
                              <span className="text-[10px] font-bold text-accent flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Est: {prediction.estimatedDaysUntilAvailable} days ({prediction.confidence} confidence)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        {!isAvailable && !prediction && (
                          <LibButton 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 text-[10px] gap-2 border-accent/10 hover:bg-accent/5"
                            onClick={() => handlePredict(a)}
                            loading={isPredicting === a.id}
                          >
                            <Sparkles className="h-3.5 w-3.5 text-accent" />
                            AI Predict
                          </LibButton>
                        )}
                        {isAvailable ? (
                          <LibButton 
                            size="sm" 
                            onClick={() => handleBorrow(a.bookId)} 
                            className="h-9 gap-1.5 shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700"
                            loading={issueBook.isPending}
                          >
                            <CheckCircle className="h-4 w-4" /> Borrow Now
                          </LibButton>
                        ) : (
                          <button 
                            onClick={() => removeAlertMutation.mutate(a.id)}
                            className="p-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Remove Alert"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {prediction && (
                      <div className="mt-4 pt-4 border-t border-border/50 animate-in slide-in-from-top-2 duration-300">
                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                          <Sparkles className="h-3 w-3 inline mr-2 text-accent" />
                          {prediction.recommendation}
                        </p>
                      </div>
                    )}
                  </LibCard>
                );
              })
            ) : (
              <LibCard className="py-16 flex flex-col items-center justify-center text-center space-y-4 bg-secondary/10 border-dashed border-muted/50 rounded-[2rem]">
                <div className="h-16 w-16 bg-background rounded-full flex items-center justify-center shadow-inner">
                  <Bell className="h-8 w-8 text-muted-foreground/20" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black text-foreground uppercase tracking-tight">Watchlist Empty</p>
                  <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">Search and track books to get AI-powered availability insights and return notifications.</p>
                </div>
              </LibCard>
            )}
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest px-1">Recent Activity</h3>
            <div className="space-y-2">
              {notifications.map((n, i) => (
                <LibCard key={i} className={`p-4 flex items-center justify-between transition-colors ${!n.read ? 'border-accent/30 bg-accent/5' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${!n.read ? 'bg-accent animate-pulse' : 'bg-muted/30'}`} />
                    <div>
                      <p className={`text-sm ${!n.read ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-black tracking-tighter opacity-50">{n.time}</p>
                    </div>
                  </div>
                </LibCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityAlerts;

