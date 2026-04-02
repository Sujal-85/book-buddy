import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: User | null;
  loading: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, name: string, studentId: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemo: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // No Firebase configured — go straight to not-loading state
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
            setUser({
              uid: fbUser.uid,
              email: data.email,
              name: data.name || 'User',
              role: data.role || 'student',
              studentId: data.studentId,
              phone: data.phone,
              photoURL: data.photoURL,
            });
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error('Firebase is not configured. Use demo login.');
    }
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (!userDoc.exists()) throw new Error('User profile not found');
    const data = userDoc.data();
    const userData: AuthUser = {
      uid: cred.user.uid,
      email: data.email,
      name: data.name || 'User',
      role: data.role || 'student',
      studentId: data.studentId,
      phone: data.phone,
    };
    setUser(userData);
    return userData;
  };

  const register = async (email: string, password: string, name: string, studentId: string, phone: string) => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error('Firebase is not configured. Use demo login.');
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      email, name, role: 'student', studentId, phone, createdAt: new Date().toISOString(),
    });
    setUser({ uid: cred.user.uid, email, name, role: 'student', studentId, phone });
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    setUser(null);
    setIsDemo(false);
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
    });
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, isDemo, login, register, logout, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
