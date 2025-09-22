import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const fetchProfile = useCallback(async (id) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Fetch profile error:", error);
        return null;
      }

      setProfile(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(data)) return data;
        return prev;
      });

      return data;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  // Public method for refreshing profile
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) await fetchProfile(currentUser.id);
      setInitializing(false);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(prev => (prev?.id !== currentUser?.id ? currentUser : prev));

      if (currentUser) fetchProfile(currentUser.id);
      else setProfile(null);
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = useCallback(async (form, navigate) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name, phone: form.phone, email: form.email } },
      });
      if (error) throw error;
      toast.success("Signup successful! Please check your email.");
      if (navigate) navigate("/signin");
    } catch (err) {
      toast.error(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (form, navigate) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;

      if (!data.user?.email_confirmed_at) {
        toast.error("Please verify your email first.");
        return;
      }

      await fetchProfile(data.user.id);
      toast.success("Signed in successfully!");
      if (navigate) navigate("/");
    } catch (err) {
      toast.error(err.message || "Signin failed.");
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  const logout = useCallback(async (navigate) => {
    toast.success("Logged out successfully!");
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    if (navigate) navigate("/signin");
  }, []);

  const contextValue = useMemo(() => ({
    initializing,
    user,
    profile,
    loading,
    signUp,
    signIn,
    logout,
    refreshProfile, // ✅ expose refresh function
  }), [initializing, user, profile, loading, signUp, signIn, logout, refreshProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
