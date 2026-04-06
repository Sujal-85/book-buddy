import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settingsSchema, type SettingsFormData } from '@/utils/validators';
import LibButton from '@/components/ui/LibButton';
import LibCard from '@/components/ui/LibCard';
import LibInput from '@/components/ui/LibInput';
import PageHeader from '@/components/layout/PageHeader';
import toast from 'react-hot-toast';
import { settingsApi } from '@/services/api';
import { RefreshCw } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const { data } = await settingsApi.get();
        reset(data as any);
      } catch (err) {
        console.error('Fetch settings error:', err);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset]);

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);
    try {
      await settingsApi.update(data as any);
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Save settings error:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

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

        <LibButton type="submit" loading={saving} className="w-full sm:w-auto">Save Settings</LibButton>
      </form>
    </div>
  );
};

export default AdminSettings;
