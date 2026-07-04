import { supabase } from './supabaseClient';

export const getSession = async () => {
  return await supabase.auth.getSession();
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

export const signUp = async (credentials) => {
  return await supabase.auth.signUp(credentials);
};

export const signInWithPassword = async (credentials) => {
  return await supabase.auth.signInWithPassword(credentials);
};

export const signInWithOAuth = async (options) => {
  return await supabase.auth.signInWithOAuth(options);
};

export const signInWithOtp = async (options) => {
  return await supabase.auth.signInWithOtp(options);
};

export const verifyOtp = async (options) => {
  return await supabase.auth.verifyOtp(options);
};
