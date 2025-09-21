import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import Loader from "@/components/Loader";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [lastAccessToken, setLastAccessToken] = useState(null); // Track last session token

  const debounce = (func, wait) => {
    let timeout;
    const debounced = (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
    debounced.cancel = () => {
      clearTimeout(timeout);
    };
    return debounced;
  };

  const fetchProfile = useCallback(async (id) => {
    const storedProfile = JSON.parse(localStorage.getItem(`profile_${id}`));
    if (storedProfile) {
      setProfile(storedProfile);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error("Fetch profile error:", error);
      toast.error("Failed to fetch profile.");
      return;
    }
    setProfile(data);
    localStorage.setItem(`profile_${id}`, JSON.stringify(data));
  }, []);

  useEffect(() => {
    console.log("AuthProvider useEffect running");
    const storedUser = JSON.parse(localStorage.getItem("authUser"));
    const storedToken = localStorage.getItem("authToken");
    if (storedUser && storedToken) {
      setUser(storedUser);
      setLastAccessToken(storedToken);
      fetchProfile(storedUser.id);
      setInitializing(false);
      return;
    }

    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      const newUser = data.session?.user ?? null;
      const newToken = data.session?.access_token ?? null;
      if (newUser && newToken !== lastAccessToken) {
        setUser(newUser);
        setLastAccessToken(newToken);
        localStorage.setItem("authUser", JSON.stringify(newUser));
        localStorage.setItem("authToken", newToken);
        fetchProfile(newUser.id);
      } else {
        localStorage.removeItem("authUser");
        localStorage.removeItem("authToken");
      }
      setInitializing(false);
    };
    getSession();

    const handleAuthChange = debounce(async (_event, session) => {
      console.log("Auth state changed:", _event, session);
      const newUser = session?.user ?? null;
      const newToken = session?.access_token ?? null;
      if (_event === "INITIAL_SESSION" && user && newToken === lastAccessToken) {
        return; // Skip redundant INITIAL_SESSION
      }
      if (newUser?.id !== user?.id || newToken !== lastAccessToken) {
        setUser(newUser);
        setLastAccessToken(newToken);
        if (newUser) {
          localStorage.setItem("authUser", JSON.stringify(newUser));
          localStorage.setItem("authToken", newToken);
          fetchProfile(newUser.id);
        } else {
          localStorage.removeItem("authUser");
          localStorage.removeItem("authToken");
          setProfile(null);
        }
      }
    }, 300);

    const { data: listener } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      listener.subscription.unsubscribe();
      handleAuthChange.cancel();
    };
  }, [fetchProfile]); // Removed user?.id from dependencies

  const signUp = useCallback(async (form, navigate) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name, phone: form.phone },
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
      const newToken = data.session?.access_token ?? null;
      setLastAccessToken(newToken);
      localStorage.setItem("authToken", newToken);
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
    setLastAccessToken(null);
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem(`profile_${user?.id}`);
    if (navigate) navigate("/signin");
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ initializing, user, profile, loading, signUp, signIn, logout }}>
      {loading && <Loader />}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);