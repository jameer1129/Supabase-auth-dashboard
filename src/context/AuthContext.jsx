import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import Loader from "@/components/Loader";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      }
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });
    setInitializing(false);
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (id) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error("Fetch profile error:", error);
      logout();
      return;
    }
    setProfile(data);
  };

  const signUp = async (form, navigate) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name, phone: form.phone ,email: form.email},
        },
      });

      if (error) throw error;

      toast.success("Signup successful! Please check your email.");
      if (navigate) navigate("/signin");
    } catch (err) {
      toast.error(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (form, navigate) => {
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
  };

  const logout = async (navigate) => {
    toast.success("Logged out successfully!");
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    if (navigate) navigate("/signin");
  };

  return (
    <AuthContext.Provider value={{ initializing, user, profile, loading, signUp, signIn, logout }}>
      {loading && <Loader />}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);