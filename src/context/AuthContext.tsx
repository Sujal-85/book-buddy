import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';

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
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, name: string, studentId: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (uid: string): Promise<AuthUser | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid,
          email: data.email,
          name: data.name || 'User',
          role: data.role || 'student',
          studentId: data.studentId,
          phone: data.phone,
          photoURL: data.photoURL,
        };
      }
      return null;
    } catch {
      // If Firestore isn't configured, return a demo user
      return {
        uid,
        email: 'demo@library.com',
        name: 'Demo User',
        role: 'admin',
      };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userData = await fetchUserRole(fbUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userData = await fetchUserRole(cred.user.uid);
    if (!userData) throw new Error('User profile not found');
    setUser(userData);
    return userData;
  };

  const register = async (email: string, password: string, name: string, studentId: string, phone: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      email,
      name,
      role: 'student',
      studentId,
      phone,
      createdAt: new Date().toISOString(),
    });
    setUser({ uid: cred.user.uid, email, name, role: 'student', studentId, phone });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
