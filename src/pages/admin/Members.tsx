import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memberSchema, type MemberFormData } from '@/utils/validators';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import LibButton from '@/components/ui/LibButton';
import LibCard from '@/components/ui/LibCard';
import LibBadge from '@/components/ui/LibBadge';
import LibInput from '@/components/ui/LibInput';
import LibTable from '@/components/ui/LibTable';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import PageHeader from '@/components/layout/PageHeader';
import { formatDate, getInitials } from '@/utils/helpers';
import type { Column } from '@/components/ui/LibTable';
import { membersApi, borrowApi } from '@/services/api';
import { toast } from 'react-hot-toast';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  studentId: string;
  joinedDate: string;
  booksIssued: number;
  status: string;
}

const demoMembers: Member[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@uni.edu', phone: '+91 9876543210', studentId: 'STU-001', joinedDate: '2024-09-01', booksIssued: 3, status: 'active' },
  { id: '2', name: 'Bob Smith', email: 'bob@uni.edu', phone: '+91 9876543211', studentId: 'STU-002', joinedDate: '2024-09-15', booksIssued: 1, status: 'active' },
  { id: '3', name: 'Carol White', email: 'carol@uni.edu', phone: '+91 9876543212', studentId: 'STU-003', joinedDate: '2024-10-01', booksIssued: 0, status: 'inactive' },
  { id: '4', name: 'Dan Brown', email: 'dan@uni.edu', phone: '+91 9876543213', studentId: 'STU-004', joinedDate: '2024-10-15', booksIssued: 2, status: 'active' },
  { id: '5', name: 'Eve Davis', email: 'eve@uni.edu', phone: '+91 9876543214', studentId: 'STU-005', joinedDate: '2024-11-01', booksIssued: 4, status: 'active' },
];

const AdminMembers: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteMember, setDeleteMember] = useState<Member | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data } = await membersApi.getAll();
      
      // Fetch active borrow counts for each member (simplified for performance)
      // In a production app, this would be computed on the server or better cached
      const borrows = await borrowApi.getActive();
      const borrowCounts = borrows.data.reduce((acc: any, b: any) => {
        acc[b.studentId] = (acc[b.studentId] || 0) + 1;
        return acc;
      }, {});

      const mapped: Member[] = data.map((u: any) => ({
        id: u.id,
        name: u.displayName || u.email.split('@')[0],
        email: u.email,
        phone: u.phone || 'N/A',
        studentId: u.studentId || (u.role === 'admin' ? 'ADMIN' : 'STU-NEW'),
        joinedDate: u.createdAt ? 
          (u.createdAt.seconds ? new Date(u.createdAt.seconds * 1000).toISOString() : u.createdAt) : 
          new Date().toISOString(),
        booksIssued: borrowCounts[u.id] || 0,
        status: u.isProfileComplete ? 'active' : 'inactive',
      }));

      setMembers(mapped);
    } catch (error) {
      toast.error('Failed to fetch members');
      console.error('[AdminMembers] Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMembers();
  }, []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
  });

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.studentId.toLowerCase().includes(search.toLowerCase())
  );

  const perPage = 10;
  const totalPages = Math.ceil(filtered.length / perPage);

  const columns: Column<Member>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent">{getInitials(m.name)}</div>
          <div>
            <p className="font-medium text-foreground">{m.name}</p>
            <p className="text-xs text-muted-foreground">{m.studentId}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'joinedDate', header: 'Joined', render: (m) => formatDate(m.joinedDate) },
    { key: 'booksIssued', header: 'Books Issued' },
    {
      key: 'status',
      header: 'Status',
      render: (m) => <LibBadge variant={m.status === 'active' ? 'available' : 'pending'}>{m.status}</LibBadge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m) => (
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditMember(m); setShowModal(true); }} className="p-1 hover:bg-secondary rounded text-muted-foreground"><Edit2 className="h-4 w-4" /></button>
          <button onClick={() => setDeleteMember(m)} className="p-1 hover:bg-secondary rounded text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  const onSubmit = async (data: MemberFormData) => {
    try {
      if (editMember) {
        await membersApi.update(editMember.id, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          studentId: data.studentId,
          isProfileComplete: true,
        });
        toast.success('Member updated successfully');
      } else {
        await membersApi.create({
          name: data.name,
          email: data.email,
          phone: data.phone,
          studentId: data.studentId,
          role: 'student',
          isProfileComplete: true,
        });
        toast.success('Member added successfully');
      }
      setShowModal(false);
      setEditMember(null);
      reset();
      fetchMembers(); // Refresh list
    } catch (error) {
      toast.error('Failed to save member details');
      console.error(error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteMember) return;
    try {
      await membersApi.delete(deleteMember.id);
      toast.success('Member removed');
      setMembers(prev => prev.filter(m => m.id !== deleteMember.id));
    } catch (err) {
      toast.error('Failed to delete member');
    } finally {
      setDeleteMember(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Members Management"
        description="Manage library members"
        action={<LibButton onClick={() => { setEditMember(null); reset(); setShowModal(true); }}><Plus className="h-4 w-4 mr-2" /> Add Member</LibButton>}
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members..." className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <LibCard className="p-0">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
            <p className="text-sm text-muted-foreground">Fetching library members...</p>
          </div>
        ) : (
          <>
            <LibTable columns={columns} data={filtered.slice((page - 1) * perPage, page * perPage)} keyExtractor={(m) => m.id} />
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </LibCard>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditMember(null); }}
        title={editMember ? 'Edit Member' : 'Add New Member'}
        footer={
          <>
            <LibButton variant="ghost" onClick={() => { setShowModal(false); setEditMember(null); }}>Cancel</LibButton>
            <LibButton onClick={handleSubmit(onSubmit)}>{editMember ? 'Update' : 'Add Member'}</LibButton>
          </>
        }
      >
        <form className="space-y-4">
          <LibInput label="Full Name" defaultValue={editMember?.name} {...register('name')} error={errors.name?.message} />
          <LibInput label="Email" type="email" defaultValue={editMember?.email} {...register('email')} error={errors.email?.message} />
          <LibInput label="Phone" type="tel" defaultValue={editMember?.phone} {...register('phone')} error={errors.phone?.message} />
          <LibInput label="Student ID" defaultValue={editMember?.studentId} {...register('studentId')} error={errors.studentId?.message} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteMember}
        onClose={() => setDeleteMember(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Member"
        message={`Are you sure you want to delete "${deleteMember?.name}"?`}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default AdminMembers;
