import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, isMockMode } from '../services/firebase';

interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  getIdToken: () => Promise<string>;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock auth helpers
function getMockUser(): MockUser | null {
  const stored = localStorage.getItem('ecotrack-mock-user');
  return stored ? JSON.parse(stored) : null;
}

// ... rest remains same until AuthProvider ...
function setMockUser(user: MockUser | null) {
  if (user) {
    localStorage.setItem('ecotrack-mock-user', JSON.stringify(user));
  } else {
    localStorage.removeItem('ecotrack-mock-user');
  }
}

function toAuthUser(user: MockUser | User): AuthUser {
  if ('getIdToken' in user) {
    // Real Firebase user
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      getIdToken: () => user.getIdToken(),
    };
  }
  // Mock user
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    getIdToken: () => Promise.resolve('mock-token-' + user.uid),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockMode) {
      // Mock mode: restore from localStorage
      const mockUser = getMockUser();
      if (mockUser) {
        setUser(toAuthUser(mockUser));
      }
      setLoading(false);
      return;
    }

    // Real Firebase mode
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(toAuthUser(firebaseUser));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    if (isMockMode) {
      const mockUser: MockUser = {
        uid: 'mock-' + Date.now(),
        email,
        displayName: email.split('@')[0],
        photoURL: null,
      };
      setMockUser(mockUser);
      setUser(toAuthUser(mockUser));
      return;
    }

    if (!auth) throw new Error('Firebase not initialized');
    const result = await signInWithEmailAndPassword(auth, email, _password);
    setUser(toAuthUser(result.user));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    if (isMockMode) {
      const mockUser: MockUser = {
        uid: 'mock-' + Date.now(),
        email,
        displayName: name,
        photoURL: null,
      };
      setMockUser(mockUser);
      setUser(toAuthUser(mockUser));
      return;
    }

    if (!auth) throw new Error('Firebase not initialized');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    setUser(toAuthUser(result.user));
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (isMockMode) {
      const mockUser: MockUser = {
        uid: 'mock-google-' + Date.now(),
        email: 'user@gmail.com',
        displayName: 'EcoTrack User',
        photoURL: null,
      };
      setMockUser(mockUser);
      setUser(toAuthUser(mockUser));
      return;
    }

    if (!auth) throw new Error('Firebase not initialized');
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    setUser(toAuthUser(result.user));
  }, []);

  const logout = useCallback(async () => {
    if (isMockMode) {
      setMockUser(null);
      setUser(null);
      return;
    }

    if (!auth) throw new Error('Firebase not initialized');
    await signOut(auth);
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (isMockMode) {
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }

    if (!auth) throw new Error('Firebase not initialized');
    await sendPasswordResetEmail(auth, email);
  }, []);

  const contextValue = useMemo(() => ({
    user,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword
  }), [user, loading, login, register, loginWithGoogle, logout, resetPassword]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
