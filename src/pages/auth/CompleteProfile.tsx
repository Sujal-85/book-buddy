import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const CompleteProfile = () => {
  const { user, updateUserProfile, checkPhoneExists } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    college: '',
    branch: '',
    year: '',
    phone: '',
  });
  
  const [phoneValidated, setPhoneValidated] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Reset validation if phone changes
    if (e.target.name === 'phone') {
      setPhoneValidated(false);
      setPhoneError('');
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const validatePhone = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      setPhoneError("Please enter a valid 10-digit phone number (e.g. 9876543210)");
      toast.error("Please enter a valid 10-digit phone number (e.g. 9876543210)");
      return;
    }
    
    // Validate phone format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      setPhoneError("Please enter a valid 10-digit phone number");
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    
    setLoading(true);
    setPhoneError('');
    try {
      // Check if phone number already exists
      const exists = await checkPhoneExists(formData.phone);
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

const handleSubmit = async () => {
    if (!formData.college || !formData.branch || !formData.year) {
      toast.error("Please fill all fields");
      return;
    }
    
    if (!phoneValidated) {
      toast.error("Please validate your phone number first");
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
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select onValueChange={(v) => handleSelectChange('branch', v)}>
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
              <Select onValueChange={(v) => handleSelectChange('year', v)}>
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
              <div className="relative flex-1">
                <Input 
                  id="phone" 
                  name="phone" 
                  placeholder="9876543210" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  disabled={phoneValidated}
                  className={phoneError ? "border-red-500" : ""}
                />
                {phoneValidated && (
                  <CheckCircle2 className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />
                )}
              </div>
              {!phoneValidated && (
                <Button variant="outline" onClick={validatePhone} disabled={loading}>
                  Validate
                </Button>
              )}
            </div>
            {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleSubmit} 
            disabled={loading || !phoneValidated}
          >
            {loading ? "Saving..." : (phoneValidated ? "Save Profile" : "Validate phone to proceed")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CompleteProfile;
