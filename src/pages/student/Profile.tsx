import React from 'react';
import { useAuth } from '@/context/AuthContext';
import LibCard from '@/components/ui/LibCard';
import LibInput from '@/components/ui/LibInput';
import LibButton from '@/components/ui/LibButton';
import PageHeader from '@/components/layout/PageHeader';
import { getInitials } from '@/utils/helpers';
import toast from 'react-hot-toast';

const StudentProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account" />

      <div className="max-w-lg space-y-6">
        {/* Avatar & Info */}
        <LibCard className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-xl font-semibold text-accent">
            {getInitials(user?.name || 'User')}
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{user?.name || 'User'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role} • {user?.studentId}</p>
          </div>
        </LibCard>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <LibCard className="text-center">
            <p className="text-2xl font-semibold text-foreground">12</p>
            <p className="text-xs text-muted-foreground">Total Borrowed</p>
          </LibCard>
          <LibCard className="text-center">
            <p className="text-2xl font-semibold text-foreground">2</p>
            <p className="text-xs text-muted-foreground">Currently Issued</p>
          </LibCard>
          <LibCard className="text-center">
            <p className="text-2xl font-semibold text-foreground">₹35</p>
            <p className="text-xs text-muted-foreground">Fines Paid</p>
          </LibCard>
        </div>

        {/* Edit Form */}
        <LibCard>
          <h3 className="text-base font-semibold text-foreground mb-4">Edit Profile</h3>
          <div className="space-y-4">
            <LibInput label="Full Name" defaultValue={user?.name} />
            <LibInput label="Phone" type="tel" defaultValue={user?.phone} />
            <LibInput label="New Password" type="password" placeholder="Leave blank to keep current" />
            <LibButton onClick={() => toast.success('Profile updated')}>Save Changes</LibButton>
          </div>
        </LibCard>
      </div>
    </div>
  );
};

export default StudentProfile;
