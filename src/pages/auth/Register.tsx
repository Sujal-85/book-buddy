import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@/utils/validators';
import { useAuth } from '@/context/AuthContext';
import LibButton from '@/components/ui/LibButton';
import LibInput from '@/components/ui/LibInput';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const Register: React.FC = () => {
  const { user, register: registerUser, checkPhoneExists, loginWithGoogle, needsProfileCompletion } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only redirect after full registration (user has an email)
    if (user && user.email) {
      if (needsProfileCompletion) {
        navigate('/complete-profile');
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/student');
      }
    }
  }, [user, needsProfileCompletion, navigate]);
  const [phoneValidated, setPhoneValidated] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const phoneValue = watch('phone');

  const validatePhone = async () => {
    if (!phoneValue || phoneValue.length < 10) {
      setPhoneError("Please enter a valid 10-digit phone number (e.g. 9876543210)");
      toast.error("Please enter a valid 10-digit phone number (e.g. 9876543210)");
      return;
    }
    
    // Validate phone format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneValue.replace(/\D/g, ''))) {
      setPhoneError("Please enter a valid 10-digit phone number");
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    
    setLoading(true);
    setPhoneError('');
    try {
      // Check if phone number already exists
      const exists = await checkPhoneExists(phoneValue);
      if (exists) {
        setPhoneError("This phone number is already registered. Please use a different number.");
        toast.error("This phone number is already registered. Please use a different number.");
        setPhoneValidated(false);
      } else {
        setPhoneValidated(true);
        toast.success("Phone number validated!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to validate phone number");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!phoneValidated) {
      toast.error("Please validate your phone number first");
      return;
    }

    setLoading(true);
    try {
      await registerUser(data.email, data.password, data.name, data.phone, data.college, data.branch, data.year);
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
            <LibInput label="College Name" placeholder="e.g. FAMT" {...register('college')} error={errors.college?.message} />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Branch</Label>
                <Controller
                  name="branch"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className={errors.branch ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CSE">CSE</SelectItem>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Mechanical">Mechanical</SelectItem>
                        <SelectItem value="Electrical">Electrical</SelectItem>
                        <SelectItem value="Civil">Civil</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.branch && <p className="text-[10px] text-red-500">{errors.branch.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Year</Label>
                <Controller
                  name="year"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className={errors.year ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Year">1st Year</SelectItem>
                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                        <SelectItem value="4th Year">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.year && <p className="text-[10px] text-red-500">{errors.year.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-foreground">Phone</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LibInput 
                    type="tel" 
                    placeholder="9876543210" 
                    {...register('phone')} 
                    error={errors.phone?.message || phoneError}
                    disabled={phoneValidated}
                  />
                  {phoneValidated && (
                    <CheckCircle2 className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />
                  )}
                </div>
                {!phoneValidated && (
                  <LibButton 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    onClick={validatePhone} 
                    loading={loading}
                    className="h-10"
                  >
                    Validate
                  </LibButton>
                )}
              </div>
            </div>

            <LibInput label="Password" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
            <LibInput label="Confirm Password" type="password" placeholder="••••••••" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
            
            <LibButton 
              type="submit" 
              loading={loading} 
              className="w-full"
              disabled={!phoneValidated}
            >
              {phoneValidated ? 'Create account' : 'Validate phone number to proceed'}
            </LibButton>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
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
                  toast.success('Signed up with Google!');
                  // Redirection will be handled by useEffect
                }
              } catch (err: any) {
                toast.error(err.message || 'Google signup failed');
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
            Sign up with Google
          </LibButton>

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

