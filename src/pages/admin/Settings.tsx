import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settingsSchema, type SettingsFormData } from '@/utils/validators';
import LibButton from '@/components/ui/LibButton';
import LibCard from '@/components/ui/LibCard';
import LibInput from '@/components/ui/LibInput';
import PageHeader from '@/components/layout/PageHeader';
import toast from 'react-hot-toast';

const AdminSettings: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      libraryName: 'Central University Library',
      timings: '9:00 AM - 8:00 PM (Mon-Sat)',
      contact: 'library@university.edu | +91 1234567890',
      rules: 'Books must be returned within the due date. Fines will be charged for late returns.',
      finePerDay: 5,
      maxBorrowDays: 14,
      maxBooksPerStudent: 3,
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    console.log('Settings:', data);
    toast.success('Settings saved successfully');
  };

  return (
    <div>
      <PageHeader title="Settings" description="Configure library settings" />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">
        <LibCard>
          <h3 className="text-base font-semibold text-foreground mb-4">Library Information</h3>
          <div className="space-y-4">
            <LibInput label="Library Name" {...register('libraryName')} error={errors.libraryName?.message} />
            <LibInput label="Timings" {...register('timings')} error={errors.timings?.message} />
            <LibInput label="Contact" {...register('contact')} error={errors.contact?.message} />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-foreground">Rules</label>
              <textarea {...register('rules')} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </LibCard>

        <LibCard>
          <h3 className="text-base font-semibold text-foreground mb-4">Borrow Settings</h3>
          <div className="space-y-4">
            <LibInput label="Fine Per Day (₹)" type="number" {...register('finePerDay')} error={errors.finePerDay?.message} />
            <LibInput label="Max Borrow Days" type="number" {...register('maxBorrowDays')} error={errors.maxBorrowDays?.message} />
            <LibInput label="Max Books Per Student" type="number" {...register('maxBooksPerStudent')} error={errors.maxBooksPerStudent?.message} />
          </div>
        </LibCard>

        <LibButton type="submit" className="w-full sm:w-auto">Save Settings</LibButton>
      </form>
    </div>
  );
};

export default AdminSettings;
