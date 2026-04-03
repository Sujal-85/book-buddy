import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  type User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/services/firebase';

export type UserRole = 'admin' | 'student';

interface AuthUser {
  uid: string;
  email: string | null;
  name: string;
  role: UserRole;
  studentId?: string;
  phone?: string;
  photoURL?: string;
  college?: string;
  branch?: string;
  year?: string;
  isProfileComplete: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: User | null;
  loading: boolean;
  isDemo: boolean;
  needsProfileCompletion: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, name: string, studentId: string, phone: string) => Promise<void>;
  loginWithGoogle: () => Promise<AuthUser | null>;
  sendPhoneOtp: (phoneNumber: string, recaptchaContainerId: string) => Promise<ConfirmationResult>;
  verifyPhoneOtp: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
  updateUserProfile: (details: Partial<AuthUser>) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemo: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            // Fixed Admin Check - Ensure admin@famt.ac.in is ALWAYS an admin
            let role = data.role || 'student';
            if (fbUser.email === 'admin@famt.ac.in') {
              role = 'admin';
              if (data.role !== 'admin') {
                await updateDoc(doc(db, 'users', fbUser.uid), { role: 'admin' });
              }
            }
            
            // 7-day session expiry check
            const lastActive = data.lastActive ? new Date(data.lastActive).getTime() : Date.now();
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - lastActive > sevenDays) {
              await signOut(auth);
              setUser(null);
              setLoading(false);
              return;
            }

            const isProfileComplete = data.iscompleted === true || 
                                      data.isProfileComplete === true || 
                                      fbUser.email === 'admin@famt.ac.in' || 
                                      !!(data.college && data.branch && data.year && (data.phone || fbUser.phoneNumber));

            const userData: AuthUser = {
              uid: fbUser.uid,
              email: fbUser.email,
              name: data.name || fbUser.displayName || 'User',
              role: fbUser.email === 'admin@famt.ac.in' ? 'admin' : (data.role || 'student'),
              studentId: data.studentId || `STU-${fbUser.uid.slice(0, 6).toUpperCase()}`,
              phone: data.phone || fbUser.phoneNumber,
              photoURL: data.photoURL || fbUser.photoURL,
              college: data.college,
              branch: data.branch,
              year: data.year,
              isProfileComplete,
            };
            
            // Update lastActive on every load to keep session alive
            await updateDoc(doc(db, 'users', fbUser.uid), { lastActive: new Date().toISOString() });
            
            setUser(userData);
            // If profile is complete, never show completion screen.
            // If incomplete, only show if it's the first login (no lastActive).
            setNeedsProfileCompletion(!userData.isProfileComplete && !data.lastActive);
          } else {
            // New user from Google/Phone (or existing with missing doc)
            const userData: AuthUser = {
              uid: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName || 'User',
              role: fbUser.email === 'admin@famt.ac.in' ? 'admin' : 'student',
              phone: fbUser.phoneNumber,
              photoURL: fbUser.photoURL,
              isProfileComplete: fbUser.email === 'admin@famt.ac.in',
            };
            setUser(userData);
            setNeedsProfileCompletion(!userData.isProfileComplete);
          }
        } catch (error) {
          console.error("Error fetching user doc:", error);
          setUser(null);
        }
      } else {
        setUser(null);
        setNeedsProfileCompletion(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    if (!auth || !db) throw new Error('Firebase not configured');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (!userDoc.exists()) throw new Error('User profile not found');
    const data = userDoc.data();
    const userData: AuthUser = {
      uid: cred.user.uid,
      email: cred.user.email,
      name: data.name,
      role: data.role,
      studentId: data.studentId,
      phone: data.phone,
      isProfileComplete: true,
    };
    setUser(userData);
    return userData;
  };

  const register = async (email: string, password: string, name: string, studentId: string, phone: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const isFixedAdmin = email === 'admin@famt.ac.in';
    const userData = {
      email, 
      name, 
      role: (isFixedAdmin ? 'admin' : 'student') as UserRole, 
      studentId: isFixedAdmin ? undefined : studentId, 
      phone, 
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), userData);
    setUser({ 
      uid: cred.user.uid, 
      email: userData.email, 
      name: userData.name, 
      role: userData.role, 
      studentId: userData.studentId, 
      phone: userData.phone, 
      isProfileComplete: isFixedAdmin 
    });
    setNeedsProfileCompletion(!isFixedAdmin);
  };

  const loginWithGoogle = async (): Promise<AuthUser | null> => {
    if (!auth || !db) throw new Error('Firebase not configured');
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const userDocRef = doc(db, 'users', cred.user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // First time Google login - ALways role: student
      const userData = {
        uid: cred.user.uid,
        email: cred.user.email,
        name: cred.user.displayName,
        role: 'student',
        photoURL: cred.user.photoURL,
        createdAt: new Date().toISOString(),
        isProfileComplete: false
      };
      await setDoc(userDocRef, userData);
      setUser(userData as AuthUser);
      setNeedsProfileCompletion(true);
      return userData as AuthUser;
    } else {
      const data = userDoc.data();
      // If user exists as admin, we should probably block Google login if the requirement is "only students"
      // But let's check if they are a student or admin
      if (data.role === 'admin') {
        await signOut(auth);
        throw new Error('Admins must use email and password to log in.');
      }
      
      const userData: AuthUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        name: data.name || cred.user.displayName,
        role: 'student', // Force student role for Google users as requested
        photoURL: data.photoURL || cred.user.photoURL,
        college: data.college,
        branch: data.branch,
        year: data.year,
        phone: data.phone || cred.user.phoneNumber,
        isProfileComplete: !!(data.college && data.branch && data.year && (data.phone || cred.user.phoneNumber)),
      };
      
      // Update role to student just in case (as requested "only students can login with gmail")
      if (data.role !== 'student') {
        await updateDoc(userDocRef, { role: 'student' });
      }
      
      setUser(userData);
      setNeedsProfileCompletion(!userData.isProfileComplete);
      return userData;
    }
  };

  const sendPhoneOtp = async (phoneNumber: string, recaptchaContainerId: string) => {
    if (!auth) throw new Error('Firebase Auth not initialized');

    // Basic sanitization: remove spaces and dashes
    let sanitizedPhone = phoneNumber.replace(/[\s-]/g, '');

    // If it doesn't start with '+', assume +91 (India) if it looks like a 10-digit number
    if (!sanitizedPhone.startsWith('+')) {
      if (sanitizedPhone.length === 10 && /^\d+$/.test(sanitizedPhone)) {
        sanitizedPhone = `+91${sanitizedPhone}`;
      } else {
        throw new Error('Phone number must start with + followed by country code (e.g., +919876543210)');
      }
    }

    // Secondary validation for E.164 format
    if (!/^\+\d{10,15}$/.test(sanitizedPhone)) {
      throw new Error('Invalid phone number format. Please use +[CountryCode][Number]');
    }

    // CLEANUP Phase: Always clear any previous reCAPTCHA to avoid "already rendered" error
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      } catch (e) {
        console.warn('Error clearing reCAPTCHA instance:', e);
      }
    }

    // Also clear the DOM container to be extra safe
    const container = document.getElementById(recaptchaContainerId);
    if (container) {
      container.innerHTML = '';
    }

    try {
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          if (recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current.clear();
            recaptchaVerifierRef.current = null;
          }
        }
      });
      
      recaptchaVerifierRef.current = verifier;
      
      return await signInWithPhoneNumber(auth, sanitizedPhone, verifier);
    } catch (error: any) {
      console.error('Error in sendPhoneOtp:', error);
      
      if (error.code === 'auth/invalid-app-credential' || error.message?.includes('invalid-app-credential')) {
        throw new Error('Firebase Project not authorized for this domain. Please ensure localhost is added to Authorized Domains in Firebase Console.');
      }
      
      if (error.code === 'auth/operation-not-allowed' || error.message?.includes('SMS unable to be sent')) {
        throw new Error('SMS region not enabled. Please enable your country (India) in Firebase Console -> Authentication -> Settings -> User actions -> SMS Region Policy.');
      }
      
      throw error;
    }
  };

  const verifyPhoneOtp = async (confirmationResult: ConfirmationResult, otp: string) => {
    await confirmationResult.confirm(otp);
  };

  const updateUserProfile = async (details: Partial<AuthUser>) => {
    if (!auth || !db || !auth.currentUser) throw new Error('Not authenticated');
    await updateDoc(doc(db, 'users', auth.currentUser.uid), details);
    
    // Refresh user state
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const updatedUser: AuthUser = {
        ...user!,
        ...data,
        isProfileComplete: !!(data.college && data.branch && data.year && (data.phone || auth.currentUser.phoneNumber)),
      };
      setUser(updatedUser);
      setNeedsProfileCompletion(!updatedUser.isProfileComplete);
    }
  };

  const logout = async () => {
    if (auth) await signOut(auth);
    setUser(null);
    setIsDemo(false);
    setNeedsProfileCompletion(false);
  };

  const loginAsDemo = (role: UserRole) => {
    setIsDemo(true);
    setUser({
      uid: 'demo-user',
      email: role === 'admin' ? 'admin@library.com' : 'student@library.com',
      name: role === 'admin' ? 'Admin User' : 'John Student',
      role,
      studentId: role === 'student' ? 'STU-001' : undefined,
      phone: '+91 9876543210',
      isProfileComplete: true,
    });
    setNeedsProfileCompletion(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, firebaseUser, loading, isDemo, needsProfileCompletion,
      login, register, loginWithGoogle, sendPhoneOtp, verifyPhoneOtp, updateUserProfile, logout, loginAsDemo 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

