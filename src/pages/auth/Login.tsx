import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/utils/validators';
import { useAuth } from '@/context/AuthContext';
import LibButton from '@/components/ui/LibButton';
import LibInput from '@/components/ui/LibInput';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { isFirebaseConfigured } from '@/services/firebase';

const Login: React.FC = () => {
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate(user.role === 'admin' ? '/admin' : '/student');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: 'admin' | 'student') => {
    loginAsDemo(role);
    toast.success(`Logged in as demo ${role}`);
    navigate(role === 'admin' ? '/admin' : '/student');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <BookOpen className="h-8 w-8 text-accent" />
          <span className="text-2xl font-semibold text-foreground">LibraryOS</span>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Sign in</h2>
          <p className="text-sm text-muted-foreground mb-6">Enter your credentials to access your account</p>

          {isFirebaseConfigured ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <LibInput label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
              <LibInput label="Password" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
              <LibButton type="submit" loading={loading} className="w-full">Sign in</LibButton>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Firebase is not configured. Use demo mode to explore the app.
              </p>
              <LibButton className="w-full" onClick={() => handleDemoLogin('admin')}>
                Login as Admin
              </LibButton>
              <LibButton variant="secondary" className="w-full" onClick={() => handleDemoLogin('student')}>
                Login as Student
              </LibButton>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
