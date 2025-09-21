import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Loader from "./Loader";
import { toast } from "sonner";

const PublicRoute = ({ children }) => {
  const { user, loading, initializing } = useAuth();

  useEffect(() => {
    if (user && !loading && !initializing) {
      toast.error("You are already logged in. Please logout first.");
    }
  }, [user]);

  if (loading || initializing) return <Loader />;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;


