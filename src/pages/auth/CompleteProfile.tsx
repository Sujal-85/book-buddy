import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useNavigate } from 'react-router-dom';
import type { ConfirmationResult } from 'firebase/auth';

const CompleteProfile = () => {
  const { user, updateUserProfile, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    college: '',
    branch: '',
    year: '',
    phone: '',
  });
  
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSendOtp = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number (e.g. 9876543210)");
      return;
    }
    
    setLoading(true);
    try {
      const result = await sendPhoneOtp(formData.phone, 'recaptcha-container');
      setConfirmationResult(result);
      setOtpSent(true);
      toast.success("OTP sent successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP. Check console for details.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || !otp) return;
    
    setLoading(true);
    try {
      await verifyPhoneOtp(confirmationResult, otp);
      toast.success("Phone verified successfully!");
      // Proceed to update profile
      handleSubmit();
    } catch (error: any) {
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async () => {
    if (!formData.college || !formData.branch || !formData.year) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      // Generate studentId from college + branch + random number
      const collegeCode = formData.college.substring(0, 3).toUpperCase();
      const branchCode = formData.branch.substring(0, 3).toUpperCase();
      const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
      const studentId = `${collegeCode}${branchCode}${randomNum}`;

      await updateUserProfile({
        college: formData.college,
        branch: formData.branch,
        year: formData.year,
        phone: formData.phone,
        studentId: studentId, // Add generated studentId
        isProfileComplete: true,
      });
      toast.success("Profile completed successfully! Your Student ID: " + studentId);
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            We need a few more details to set up your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="college">College Name</Label>
            <Input 
              id="college" 
              name="college" 
              placeholder="e.g. FAMT" 
              value={formData.college} 
              onChange={handleInputChange} 
              disabled={otpSent}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select onValueChange={(v) => handleSelectChange('branch', v)} disabled={otpSent}>
                <SelectTrigger>
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
            </div>
            
            <div className="space-y-2">
              <Label>Year</Label>
              <Select onValueChange={(v) => handleSelectChange('year', v)} disabled={otpSent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Input 
                id="phone" 
                name="phone" 
                placeholder="9876543210" 
                value={formData.phone} 
                onChange={handleInputChange} 
                disabled={otpSent}
              />
              {!otpSent && (
                <Button variant="outline" onClick={handleSendOtp} disabled={loading}>
                  Verify
                </Button>
              )}
            </div>
            <div id="recaptcha-container"></div>
          </div>

          {otpSent && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
              <div className="space-y-2">
                <Label>Enter OTP</Label>
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
              <Button className="w-full" onClick={handleVerifyOtp} disabled={loading}>
                {loading ? "Verifying..." : "Verify & Save"}
              </Button>
              <Button variant="link" className="w-full text-xs" onClick={() => setOtpSent(false)} disabled={loading}>
                Change Phone Number
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!otpSent && (
            <Button className="w-full" onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default CompleteProfile;
