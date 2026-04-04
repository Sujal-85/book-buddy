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
import { useEffect } from 'react';
import { seedFixedAdmin } from '@/utils/seedAdmin';

const Login: React.FC = () => {
  const { user, login, loginAsDemo, loginWithGoogle, needsProfileCompletion } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only redirect if they logged in properly with email/google
    if (user && user.email) {
      if (needsProfileCompletion) {
        navigate('/complete-profile');
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/student');
      }
    }
  }, [user, needsProfileCompletion, navigate]);
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

  const handleFixAdmin = async () => {
    setLoading(true);
    const res = await seedFixedAdmin();
    if (res.success) {
      toast.success('Admin email registered in system. Please register or login with admin@famt.ac.in');
    } else {
      toast.error(res.error || 'Failed to seed admin');
    }
    setLoading(false);
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

          <div className="space-y-4">
            {isFirebaseConfigured ? (
              <>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <LibInput label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
                  <LibInput label="Password" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
                  <LibButton type="submit" loading={loading} className="w-full">Sign in</LibButton>
                </form>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <LibButton 
                  variant="secondary" 
                  type="button" 
                  className="w-full flex items-center justify-center gap-2" 
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const user = await loginWithGoogle();
                      if (user) {
                        toast.success('Logged in with Google!');
                        // Redirection will be handled by useEffect
                      }
                    } catch (err: any) {
                      toast.error(err.message || 'Google login failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  loading={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="mr-2">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </LibButton>
              </>
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
          </div>

          <p className="text-sm text-muted-foreground text-center mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:underline">Register</Link>
          </p>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <button 
              onClick={handleFixAdmin}
              className="text-[10px] text-muted-foreground/30 hover:text-accent transition-colors uppercase tracking-widest"
            >
              Initialize Admin System
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Login;
