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
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import type { ConfirmationResult } from 'firebase/auth';
import { useEffect } from 'react';

const Register: React.FC = () => {
  const { user, register: registerUser, sendPhoneOtp, verifyPhoneOtp, loginWithGoogle, needsProfileCompletion } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (needsProfileCompletion) {
        navigate('/complete-profile');
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/student');
      }
    }
  }, [user, needsProfileCompletion, navigate]);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const phoneValue = watch('phone');

  const handleSendOtp = async () => {
    if (!phoneValue || phoneValue.length < 10) {
      toast.error("Please enter a valid 10-digit phone number (e.g. 9876543210)");
      return;
    }
    
    setLoading(true);
    try {
      const result = await sendPhoneOtp(`+91${phoneValue}`, 'recaptcha-container-reg');
      setConfirmationResult(result);
      setOtpSent(true);
      toast.success("OTP sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || !otp) return;
    setLoading(true);
    try {
      await verifyPhoneOtp(confirmationResult, otp);
      setPhoneVerified(true);
      setOtpSent(false);
      toast.success("Phone verified!");
    } catch (error: any) {
      toast.error("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!phoneVerified) {
      toast.error("Please verify your phone number first");
      return;
    }

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
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-foreground">Phone</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LibInput 
                    type="tel" 
                    placeholder="9876543210" 
                    {...register('phone')} 
                    error={errors.phone?.message}
                    disabled={phoneVerified || otpSent}
                  />
                  {phoneVerified && (
                    <CheckCircle2 className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />
                  )}
                </div>
                {!phoneVerified && !otpSent && (
                  <LibButton 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleSendOtp} 
                    loading={loading}
                    className="h-10"
                  >
                    Verify
                  </LibButton>
                )}
              </div>
              <div id="recaptcha-container-reg"></div>
            </div>

            {otpSent && (
              <div className="space-y-3 bg-muted/50 p-3 rounded-md border border-border animate-in fade-in slide-in-from-top-1">
                <label className="text-xs font-medium uppercase text-muted-foreground">Verification Code</label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <LibButton type="button" className="w-full h-8 text-xs" onClick={handleVerifyOtp} loading={loading}>
                  Confirm OTP
                </LibButton>
              </div>
            )}

            <LibInput label="Password" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
            <LibInput label="Confirm Password" type="password" placeholder="••••••••" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
            
            <LibButton 
              type="submit" 
              loading={loading} 
              className="w-full"
              disabled={!phoneVerified}
            >
              {phoneVerified ? 'Create account' : 'Verify phone number to proceed'}
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

