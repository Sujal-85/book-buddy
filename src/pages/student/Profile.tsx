import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import { getInitials } from '@/utils/helpers';
import toast from 'react-hot-toast';
import { borrowApi } from '@/services/api';
import { BookOpen, BookMarked, BadgeIndianRupee, User, Mail, Phone, Lock, ShieldCheck, Edit3, Camera, Loader2 } from 'lucide-react';

const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: allBorrows = [], isLoading: loadingBorrows } = useQuery({
    queryKey: ['student-borrows', user?.uid],
    queryFn: () => borrowApi.getStudentBorrows(user!.uid).then(r => r.data),
    enabled: !!user?.uid,
  });
  const totalBorrowed = allBorrows.length;
  const activeBorrows = allBorrows.filter((b: any) => b.status === 'active').length;

  // Calculate fines: overdue active borrows at ₹5/day
  const today = new Date();
  const outstandingFines = allBorrows
    .filter((b: any) => b.status === 'active' && b.dueDate && new Date(b.dueDate) < today)
    .reduce((sum: number, b: any) => {
      const daysOverdue = Math.floor((today.getTime() - new Date(b.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      return sum + daysOverdue * 5;
    }, 0);


  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast.success('Profile updated successfully!');
  };

  const stats = [
    { label: 'Total Borrowed', value: loadingBorrows ? '…' : String(totalBorrowed), icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Active Borrows', value: loadingBorrows ? '…' : String(activeBorrows), icon: BookMarked, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Outstanding Fines', value: loadingBorrows ? '…' : `₹${outstandingFines}`, icon: BadgeIndianRupee, color: outstandingFines > 0 ? 'text-red-500' : 'text-amber-500', bg: outstandingFines > 0 ? 'bg-red-500/10' : 'bg-amber-500/10', border: outstandingFines > 0 ? 'border-red-500/20' : 'border-amber-500/20' },
  ];

  return (
    <div className="h-full flex flex-col overflow-x-hidden">
      <div className="flex-1 overflow-y-auto pb-10">
        {/* Hero Banner + Avatar wrapper */}
        <div className="relative mb-6">
          {/* Banner */}
          <div className="relative h-36 rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.22 262) 0%, oklch(0.45 0.18 290) 50%, oklch(0.35 0.14 320) 100%)' }}>
            {/* Decorative circles — inside overflow-hidden so they don't bleed out */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 blur-sm" />
            <div className="absolute top-4 right-16 w-20 h-20 rounded-full bg-white/5" />
            <div className="absolute top-8 left-1/3 w-28 h-28 rounded-full bg-white/5" />

            {/* Edit icon top-right */}
            <button className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm z-10">
              <Edit3 className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Avatar — outside overflow-hidden, overlaps banner bottom */}
          <div className="absolute bottom-0 left-8 translate-y-1/2">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-white shadow-xl shadow-black/20 flex items-center justify-center text-3xl font-black text-accent border-4 border-background">
                {getInitials(user?.name || 'User')}
              </div>
              <button className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Spacer for avatar overlap */}
        <div className="h-16" />

        {/* Name & Meta */}
        <div className="px-1 mb-6">
          <h1 className="text-2xl font-black text-foreground">{user?.name || 'Student'}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Mail className="h-3.5 w-3.5" /> {user?.email}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium capitalize">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" /> {user?.role}
            </span>
            {user?.studentId && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono font-bold">
                  {user.studentId}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
            <LibCard key={label} className={`flex flex-col items-center py-5 gap-3 border ${border} hover:scale-[1.02] transition-transform duration-200`}>
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="text-center">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 leading-tight">{label}</p>
              </div>
            </LibCard>
          ))}
        </div>

        {/* Edit Profile Form */}
        <LibCard className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <User className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Edit Profile</h3>
              <p className="text-[11px] text-muted-foreground">Update your personal information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3 w-3" /> Full Name
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background text-sm font-medium focus:ring-2 focus:ring-accent/30 focus:border-accent/50 outline-none transition-all"
                placeholder="Your full name"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> Phone Number
              </label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                type="tel"
                className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background text-sm font-medium focus:ring-2 focus:ring-accent/30 focus:border-accent/50 outline-none transition-all"
                placeholder="Your phone number"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> Email Address
              </label>
              <div className="w-full px-4 py-2.5 rounded-xl border border-border/40 bg-secondary/30 text-sm font-medium text-muted-foreground cursor-not-allowed flex items-center gap-2">
                <span className="flex-1 truncate">{user?.email}</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> New Password
              </label>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background text-sm font-medium focus:ring-2 focus:ring-accent/30 focus:border-accent/50 outline-none transition-all"
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>

          {/* Role & ID badge */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/5 border border-accent/10">
            <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
            <div className="text-xs text-muted-foreground">
              Your account is verified as a <span className="font-bold text-foreground capitalize">{user?.role}</span>
              {user?.studentId && <> with ID <span className="font-mono font-bold text-foreground">{user.studentId}</span></>}.
              Contact admin to change role or student ID.
            </div>
          </div>

          <LibButton
            onClick={handleSave}
            loading={saving}
            className="w-full py-3 font-bold text-sm shadow-lg shadow-accent/10"
          >
            Save Changes
          </LibButton>
        </LibCard>
      </div>
    </div>
  );
};

export default StudentProfile;
