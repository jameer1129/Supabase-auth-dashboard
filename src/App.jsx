import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Home from "./pages/Home";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sonner";
import PublicRoute from "@/components/PublicRoute.jsx";
import EditProfile from "./pages/EditProfile";
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route
            path="/signin"
            element={
              <PublicRoute>
                <Signin />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />

          {/* ✅ Protected user routes */}
          <Route element={<PrivateRoute allowedRoles={["user", "admin"]} />}>
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/user-dashboard/:userId" element={<UserDashboard />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/edit-profile/:userId" element={<EditProfile />} />
          </Route>

          {/* ✅ Protected admin route */}
          <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<h1>Page not found</h1>} />
        </Routes>
      </Router>
      <Toaster richColors position="top-center" />
    </AuthProvider>
  );
}

export default App;
