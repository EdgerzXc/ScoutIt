import { supabase } from './supabaseClient';

export const getSession = async () => {
  return await supabase.auth.getSession();
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

export const signUp = async (email, password, metadata) => {
  return await supabase.auth.signUp({ email, password, options: metadata ? { data: metadata } : undefined });
};

export const signInWithPassword = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signInWithOAuth = async (provider, options) => {
  return await supabase.auth.signInWithOAuth({ provider, options });
};

export const signInWithOtp = async (email) => {
  return await supabase.auth.signInWithOtp({ email });
};

export const verifyOtp = async (email, token) => {
  return await supabase.auth.verifyOtp({ email, token, type: 'email' });
};
