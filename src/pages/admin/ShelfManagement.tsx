import React from 'react';
import { MapPin, BookOpen, ArrowRight, RefreshCw, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';

const shelves = [
  { id: 'A1', section: 'Science & Mathematics', books: 1250, capacity: 1500, utilization: 83 },
  { id: 'A2', section: 'Engineering & Technology', books: 980, capacity: 1000, utilization: 98 },
  { id: 'B1', section: 'Computer Science', books: 1450, capacity: 1400, utilization: 103 },
  { id: 'B2', section: 'Programming & Software', books: 890, capacity: 1200, utilization: 74 },
  { id: 'B3', section: 'AI & Machine Learning', books: 320, capacity: 500, utilization: 64 },
  { id: 'C1', section: 'Humanities & Management', books: 670, capacity: 800, utilization: 84 },
  { id: 'C2', section: 'Reference & Journals', books: 535, capacity: 600, utilization: 89 },
];

const relocations = [
  { book: 'Clean Code', from: 'B1-Row3', to: 'B2-Row1', reason: 'Shelf B1 is over capacity' },
  { book: 'AI: A Modern Approach', from: 'A2-Row5', to: 'B3-Row2', reason: 'Better categorization' },
  { book: 'Database Systems', from: 'B2-Row4', to: 'B1-Row6', reason: 'Higher demand location' },
];

const ShelfManagement: React.FC = () => (
  <div className="h-full flex flex-col overflow-hidden">
    <PageHeader title="Smart Shelf Management" description="AI-optimized book placement and shelf utilization tracking" />
    <div className="flex-1 overflow-y-auto space-y-6 pr-1">
      {/* Shelf Map */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {shelves.map((s) => (
          <LibCard key={s.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">{s.id}</span>
              <LibBadge variant={s.utilization > 95 ? 'issued' : s.utilization > 80 ? 'default' : 'available'}>
                {s.utilization}%
              </LibBadge>
            </div>
            <p className="text-sm font-medium text-foreground">{s.section}</p>
            <div className="h-2 bg-secondary rounded-full">
              <div className={`h-2 rounded-full ${s.utilization > 95 ? 'bg-red-500' : s.utilization > 80 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(s.utilization, 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{s.books} / {s.capacity} books</p>
          </LibCard>
        ))}
      </div>

      {/* AI Relocation Suggestions */}
      <LibCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><RefreshCw className="h-4 w-4 text-accent" /> AI Relocation Suggestions</h3>
          <LibButton size="sm" variant="ghost" onClick={() => toast.success('Applying all relocations...')}>Apply All</LibButton>
        </div>
        <div className="space-y-3">
          {relocations.map((r) => (
            <div key={r.book} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{r.book}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-1.5 py-0.5 bg-background rounded">{r.from}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded">{r.to}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{r.reason}</p>
              </div>
              <LibButton size="sm" onClick={() => toast.success(`Relocated: ${r.book}`)}><CheckCircle className="h-3 w-3" /></LibButton>
            </div>
          ))}
        </div>
      </LibCard>
    </div>
  </div>
);

export default ShelfManagement;
