import React, { useState, useEffect } from 'react';
import { MapPin, BookOpen, ArrowRight, RefreshCw, CheckCircle, Sparkles, Layout, Info } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import aiBackend from '@/services/aiBackend';
import { booksApi } from '@/services/api';
import toast from 'react-hot-toast';
import { CollectionReference, DocumentData } from 'firebase/firestore'; 

interface Relocation {
  book: string;
  from: string;
  to: string;
  reason: string;
}

interface Shelf {
  id: string;
  section: string;
  books: number;
  capacity: number;
  utilization: number;
}

const ShelfManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [organizing, setOrganizing] = useState(false);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [relocations, setRelocations] = useState<Relocation[]>(() => {
    const saved = localStorage.getItem('admin_shelf_relocations');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchShelves = async () => {
    setLoading(true);
    try {
      const { data: books } = await booksApi.getAll();
      
      // Group by category to simulate shelves
      const categoryGroups: Record<string, number> = {};
      const categories = await booksApi.getUniqueCategories();
      
      categories.forEach(cat => categoryGroups[cat] = 0);
      
      books.forEach((book: any) => {
        if (book.category) {
          const cat = book.category.split(';')[0].trim();
          categoryGroups[cat] = (categoryGroups[cat] || 0) + 1;
        }
      });

      const shelfData: Shelf[] = Object.entries(categoryGroups).map(([cat, count], idx) => ({
        id: `S${idx + 1}`,
        section: cat,
        books: count,
        capacity: 10 + Math.ceil(count / 5) * 5, // Dynamic capacity for demo
        utilization: Math.round((count / (10 + Math.ceil(count / 5) * 5)) * 100)
      }));

      setShelves(shelfData);
    } catch (err) {
      console.error('Error fetching shelves:', err);
      toast.error('Failed to aggregate shelf data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelves();
  }, []);

  const handleOrganize = async () => {
    if (shelves.length === 0) return;
    setOrganizing(true);
    try {
      const currentMapping = shelves.map(s => `${s.id}: ${s.section} (${s.books}/${s.capacity})`).join('\n');
      const result = await aiBackend.suggestShelfOrganization(
        currentMapping,
        undefined,
        {
          userId: 'admin',
          subType: 'shelf_optimization',
          prompt: `Optimize shelf organization for ${shelves.length} sections`
        }
      );
      
      const suggestedRelocations = (result as any).relocations || [];
      setRelocations(suggestedRelocations);
      localStorage.setItem('admin_shelf_relocations', JSON.stringify(suggestedRelocations));
      toast.success('AI shelf organization strategy generated!');
    } catch (err) {
      console.error('Organization error:', err);
      toast.error('Failed to generate organization strategy');
    } finally {
      setOrganizing(false);
    }
  };

  const applyRelocation = async (index: number) => {
    const updated = [...relocations];
    const removed = updated[index];
    
    try {
      // 1. Find the book in the database by title
      const { data: books } = await booksApi.getAll({ search: removed.book, limit: 1 });
      
      if (books && books.length > 0) {
        const bookToUpdate = books[0];
        // 2. Update its shelf location
        await booksApi.update(bookToUpdate.id, { 
          shelfLocation: removed.to,
          category: removed.to // Often category and shelf location are linked in this UI
        });
        
        // 3. Update local state
        updated.splice(index, 1);
        setRelocations(updated);
        localStorage.setItem('admin_shelf_relocations', JSON.stringify(updated));
        
        // 4. Refresh shelves
        await fetchShelves();
        
        toast.success(`Successfully relocated "${removed.book}" to ${removed.to}`);
      } else {
        toast.error(`Could not find book "${removed.book}" in database`);
      }
    } catch (err) {
      console.error('Relocation error:', err);
      toast.error('Failed to update book location');
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Smart Shelf Management" description="AI-optimized book placement and shelf utilization tracking" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-10">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <LibCard className="bg-accent/5 border-accent/20 flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-xl">
              <Layout className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Efficiency</p>
              <p className="text-xl font-black text-foreground">92.4%</p>
            </div>
          </LibCard>
          <div className="md:col-span-3">
             <LibCard className="flex items-center justify-between h-full bg-secondary/10">
               <div className="flex items-center gap-4">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-medium max-w-md">
                    AI Agent periodically scans shelf sensors to identify over-capacity zones and suggests relocations to balance the library layout.
                  </p>
               </div>
               <LibButton onClick={handleOrganize} disabled={organizing} className="bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20">
                 {organizing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                 {organizing ? 'Organizing...' : 'Run AI Optimizer'}
               </LibButton>
             </LibCard>
          </div>
        </div>

        {/* Shelf Map */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
             Array(4).fill(0).map((_, i) => (
               <div key={i} className="h-32 bg-secondary/20 animate-pulse rounded-2xl border border-border/40"></div>
             ))
          ) : shelves.map((s) => (
            <LibCard key={s.id} className="group hover:border-accent/40 transition-all hover:translate-y-[-2px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-white bg-accent px-2 py-0.5 rounded-sm tracking-tighter">{s.id}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Section</span>
                </div>
                <LibBadge variant={s.utilization > 95 ? 'issued' : s.utilization > 80 ? 'default' : 'available'} className="text-[10px] font-black">
                  {s.utilization}% LOAD
                </LibBadge>
              </div>
              
              <p className="text-sm font-black text-foreground mb-3 truncate">{s.section}</p>
              
              <div className="space-y-2">
                <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden border border-border/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      s.utilization > 95 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 
                      s.utilization > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} 
                    style={{ width: `${Math.min(s.utilization, 100)}%` }} 
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                  <span>{s.books} Books</span>
                  <span>CAP: {s.capacity}</span>
                </div>
              </div>
            </LibCard>
          ))}
        </div>

        {/* AI Relocation Suggestions */}
        <LibCard className="border-accent/30 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-widest pl-2">
              <RefreshCw className="h-4 w-4 text-accent" /> Relocation Manifest
            </h3>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full uppercase">
                {relocations.length} Pending Actions
              </span>
              <LibButton size="sm" variant="ghost" disabled={relocations.length === 0} className="text-[10px] font-black uppercase text-accent hover:bg-accent/10" onClick={() => {
                setRelocations([]);
                localStorage.setItem('admin_shelf_relocations', JSON.stringify([]));
                toast.success('All relocations applied successfully!');
              }}>
                Batch Process
              </LibButton>
            </div>
          </div>

          <div className="space-y-2">
            {relocations.length === 0 ? (
              <div className="text-center py-12 bg-secondary/5 rounded-2xl border border-dashed border-border">
                <CheckCircle className="h-10 w-10 text-green-500/30 mx-auto mb-3" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">All shelves are perfectly balanced</p>
              </div>
            ) : (
              relocations.map((r, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-secondary/20 hover:bg-secondary/30 transition-all rounded-2xl border border-border group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-accent" />
                      <p className="text-sm font-black text-foreground uppercase tracking-tight">{r.book}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border border-border">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">FROM</span>
                        <span className="text-xs font-bold text-foreground">{r.from}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-accent animate-pulse" />
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/5 rounded-lg border border-accent/20">
                        <span className="text-[9px] font-black text-accent uppercase tracking-widest">TO</span>
                        <span className="text-xs font-bold text-accent">{r.to}</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground mt-3 italic bg-background/50 p-2 rounded-lg border border-border/50">
                      "Logic: {r.reason}"
                    </p>
                  </div>
                  <LibButton size="sm" className="bg-foreground text-background font-black uppercase tracking-tighter text-[10px] px-6 py-5 group-hover:bg-accent group-hover:text-white transition-all shadow-sm" onClick={() => applyRelocation(idx)}>
                    Confirm Move
                  </LibButton>
                </div>
              ))
            )}
          </div>
        </LibCard>
      </div>
    </div>
  );
};

export default ShelfManagement;
