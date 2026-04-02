import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@/utils/validators';
import { useAuth } from '@/context/AuthContext';
import LibButton from '@/components/ui/LibButton';
import LibInput from '@/components/ui/LibInput';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      await registerUser(data.email, data.password, data.name, data.studentId, data.phone);
      toast.success('Account created successfully!');
      navigate('/student');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <BookOpen className="h-8 w-8 text-accent" />
          <span className="text-2xl font-semibold text-foreground">LibraryOS</span>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Create account</h2>
          <p className="text-sm text-muted-foreground mb-6">Register as a student to start borrowing books</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <LibInput label="Full Name" placeholder="John Doe" {...register('name')} error={errors.name?.message} />
            <LibInput label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
            <LibInput label="Student ID" placeholder="STU-001" {...register('studentId')} error={errors.studentId?.message} />
            <LibInput label="Phone" type="tel" placeholder="+91 9876543210" {...register('phone')} error={errors.phone?.message} />
            <LibInput label="Password" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
            <LibInput label="Confirm Password" type="password" placeholder="••••••••" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
            <LibButton type="submit" loading={loading} className="w-full">Create account</LibButton>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
