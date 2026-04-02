import React, { useState } from 'react';
import { Target, Trophy, Flame, BookOpen, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';

const goals = [
  { id: '1', title: 'Read 5 books this month', progress: 3, target: 5, type: 'monthly' },
  { id: '2', title: 'Explore 3 new categories', progress: 2, target: 3, type: 'challenge' },
  { id: '3', title: 'Read 50 books this year', progress: 28, target: 50, type: 'yearly' },
];

const achievements = [
  { name: 'Bookworm', icon: '📚', description: 'Read 10 books', earned: true },
  { name: 'Speed Reader', icon: '⚡', description: 'Return a book within 3 days', earned: true },
  { name: 'Explorer', icon: '🧭', description: 'Borrow from 5 categories', earned: true },
  { name: 'Scholar', icon: '🎓', description: 'Read 25 books', earned: true },
  { name: 'Librarian\'s Pick', icon: '⭐', description: 'Read 50 books', earned: false },
  { name: 'Genre Master', icon: '🏆', description: 'Read from all categories', earned: false },
];

const challenges = [
  { title: 'March Reading Sprint', description: 'Read 3 books in March', participants: 145, daysLeft: 5, joined: true },
  { title: 'AI & ML Deep Dive', description: 'Read 2 AI/ML books', participants: 89, daysLeft: 15, joined: false },
  { title: 'Classic Literature Week', description: 'Read 1 classic this week', participants: 67, daysLeft: 3, joined: false },
];

const ReadingGoals: React.FC = () => (
  <div className="h-full flex flex-col overflow-hidden">
    <PageHeader title="Reading Goals & Challenges" description="Set goals, earn achievements, and compete with peers" />
    <div className="flex-1 overflow-y-auto space-y-6 pr-1">
      {/* Streak */}
      <LibCard className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <Flame className="h-7 w-7 text-orange-500" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">12 Day Streak 🔥</p>
          <p className="text-xs text-muted-foreground">You've been reading consistently! Keep it up!</p>
        </div>
      </LibCard>

      {/* Goals */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Your Goals</h3>
        <div className="space-y-3">
          {goals.map((g) => (
            <LibCard key={g.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> {g.title}</p>
                <span className="text-sm font-bold text-accent">{g.progress}/{g.target}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full"><div className="h-2 bg-accent rounded-full transition-all" style={{ width: `${(g.progress / g.target) * 100}%` }} /></div>
            </LibCard>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Achievements</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {achievements.map((a) => (
            <LibCard key={a.name} className={`text-center space-y-1 ${!a.earned ? 'opacity-40' : ''}`}>
              <span className="text-2xl">{a.icon}</span>
              <p className="text-xs font-medium text-foreground">{a.name}</p>
              <p className="text-[10px] text-muted-foreground">{a.description}</p>
              {a.earned && <CheckCircle className="h-3 w-3 text-green-500 mx-auto" />}
            </LibCard>
          ))}
        </div>
      </div>

      {/* Challenges */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Active Challenges</h3>
        <div className="space-y-3">
          {challenges.map((c) => (
            <LibCard key={c.title} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.description} · {c.participants} participants · {c.daysLeft} days left</p>
              </div>
              {c.joined ? <LibBadge variant="available">Joined</LibBadge> : <LibButton size="sm" onClick={() => toast.success('Joined challenge!')}>Join</LibButton>}
            </LibCard>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default ReadingGoals;
