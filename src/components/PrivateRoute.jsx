import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Loader from "./Loader";

const PrivateRoute = ({ allowedRoles }) => {
  const { user, profile, loading, initializing } = useAuth();

  if (loading || initializing) return <Loader />;

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!profile) {
    return <Loader/>
  }

  if (profile && allowedRoles && !allowedRoles.includes(profile.role)) {
    if (profile.role === "admin") return <Navigate to="/admin-dashboard" replace />;
    if (profile.role === "user") return <Navigate to="/user-dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
