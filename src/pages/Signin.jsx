import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";

const Signin = () => {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    signIn(form, navigate);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-2">
      <Card className="p-8 shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Label>Email</Label>
          <Input
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Label>Password</Label>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              required
            />
            <Button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 text-gray-500 hover:text-gray-800 cursor-pointer bg-gray-100 hover:bg-gray-200 border-0 rounded-l-none h-full px-3"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          </div>

          <Button type="submit" className="w-full mt-4">
            Sign In
          </Button>

          <p
            className="w-fit cursor-pointer border-b border-white transition-all duration-200 hover:border-b hover:border-black mt-2"
            onClick={() => navigate("/signup")}
          >
            Don't have an account? Sign Up
          </p>
        </form>
      </Card>

      <h2
        className="w-fit cursor-pointer border-b border-white transition-all duration-200 hover:border-b hover:border-black mt-6"
        onClick={() => navigate("/")}
      >
        ← Go to Home
      </h2>
    </div>
  );
};

export default Signin;
