import { supabase } from './supabaseClient';

export const signUp = async (email, password, metadata = {}) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
};

export const signInWithPassword = async (email, password) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getSession = async () => {
  return await supabase.auth.getSession();
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};
