import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSubscribed: boolean;
  isUnlimited: boolean;
  tokenBalance: number;
  features: string[];
  isLoading: boolean;
  isSimulatingUser: boolean;
  isActualAdmin: boolean;
  toggleSimulationMode: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [features, setFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulatingUser, setIsSimulatingUser] = useState(false);
  const [isActualAdmin, setIsActualAdmin] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
      const originalIsAdmin = data.role === 'admin';
      setIsActualAdmin(originalIsAdmin);
      setIsAdmin(originalIsAdmin && !isSimulatingUser);
      setIsSubscribed(data.subscription_status === 'active');
      setIsUnlimited(data.is_unlimited ?? false);
      setTokenBalance(data.token_balance ?? 0);
      setFeatures(data.features || []);
    } else if (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsUnlimited(false);
        setTokenBalance(0);
        setFeatures([]);
        setIsLoading(false);
      }
    });

    // Listen for profile changes in real-time
    let profileSubscription: any = null;

    if (user) {
      profileSubscription = supabase
        .channel(`profile:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          () => {
            // Re-fetch complete profile to ensure we have all fields (role, features, etc)
            fetchProfile(user.id);
          }
        )
        .subscribe();
    }

    return () => {
      subscription.unsubscribe();
      if (profileSubscription) profileSubscription.unsubscribe();
    };
  }, [user?.id]); // Only re-run if the user ID changes

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const toggleSimulationMode = () => {
    setIsSimulatingUser(prev => !prev);
  };

  useEffect(() => {
    if (isActualAdmin) {
      setIsAdmin(!isSimulatingUser);
    }
  }, [isSimulatingUser, isActualAdmin]);

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      isAdmin,
      isSubscribed,
      isUnlimited,
      tokenBalance,
      features,
      isLoading,
      isSimulatingUser,
      isActualAdmin,
      toggleSimulationMode,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
