import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import LogoutButton from "@/components/LogoutButton";

const Home = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap flex-col items-center justify-center min-h-screen">
      <img src="logo.png" alt="Logo" className="w-50" />
      <h1 className="text-3xl font-bold mb-10 text-center">Welcome to the Dashboard App</h1>
      <div className="flex space-x-4">
        {user ? (
          <>
            <Button
              onClick={() =>
                navigate(
                  profile.role === "admin" ? "/admin-dashboard" : "/user-dashboard"
                )
              }
            >
              Go to Dashboard
            </Button>
            <LogoutButton navigate={navigate} />
          </>
        ) : (
          <>
            <Button onClick={() => navigate("/signup")}>Sign Up</Button>
            <Button variant="outline" onClick={() => navigate("/signin")}>
              Sign In
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
