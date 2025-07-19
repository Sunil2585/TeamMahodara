import React, { useState, useEffect, useContext, createContext } from 'react';
import { supabase } from '../supabaseClient'; // Ensure you have this file

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Function to clear any existing messages
  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  useEffect(() => {
    // Check for an active session on initial render
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    // Set up a listener for authentication state changes (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup the listener when the component unmounts
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Value object to be passed to the provider
  const value = {
    user,
    loading,
    errorMsg,
    successMsg,
    clearMessages,
    signUpWithEmail: async (credentials) => {
      setLoading(true);
      clearMessages();
      // This is the function that triggers the verification email
      const { data, error } = await supabase.auth.signUp(credentials);
      
      if (error) {
        setErrorMsg(error.message);
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        // Handle the case where a user already exists but is unconfirmed.
        setErrorMsg("User already exists. Please check your email to verify your account.");
      }
      else {
        // On success, Supabase sends the email automatically.
        setSuccessMsg('Success! Please check your email to verify your account.');
      }
      setLoading(false);
      return { data, error };
    },
    logInWithEmail: async (credentials) => {
      setLoading(true);
      clearMessages();
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) {
        setErrorMsg(error.message);
      }
      setLoading(false);
      return { data, error };
    },
    signInWithGoogle: async (options) => {
      setLoading(true);
      clearMessages();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options,
      });
      if (error) {
        setErrorMsg(error.message);
        setLoading(false); // Only set loading to false if there's an error
      }
    },
    signOut: async () => {
      clearMessages();
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to easily access the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
