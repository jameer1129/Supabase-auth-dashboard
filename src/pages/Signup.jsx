import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";

const Signup = () => {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "", terms: false });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = (e) => { 
    e.preventDefault(); 
    const cleanedForm = {
      ...form,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      phone: form.phone.trim()
    };

    if (!cleanedForm.terms) {
      toast.error("You must accept the Terms & Conditions.");
      return;
    }

    if (!/^\d{10}$/.test(cleanedForm.phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    signUp(cleanedForm, navigate); 
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-2">
      <Card className="p-8 shadow-md w-full max-w-md">
        <h2 className="text-2xl text-center font-bold">Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Label>Full Name</Label>
          <Input name="full_name" value={form.full_name} onChange={handleChange} required />
          <Label>Email</Label>
          <Input name="email" type="email" value={form.email} onChange={handleChange} required />
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
          <Label>Phone</Label>
          <Input name="phone" type="tel" value={form.phone} onChange={handleChange} required />
          <div className="flex items-center space-x-2">
            <Checkbox
              name="terms"
              checked={form.terms}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, terms: checked }))
              }
              required  
            />
            <Label htmlFor="terms" className="text-sm">
              I accept the{" "}
              <a href="#" className="underline">
                Terms & Conditions
              </a>
            </Label>
          </div>
          <Button type="submit" className="w-full mt-2">Sign Up</Button>
          <p 
            className="w-fit cursor-pointer border-b border-white transition-all duration-200 hover:border-b hover:border-black mt-2" 
            onClick={() => navigate("/signin")} 
          > 
            Already have an account? Sign In
          </p>
        </form>
      </Card>
      <h2 
        className="w-fit cursor-pointer border-b border-white transition-all duration-200 hover:border-b hover:border-blue-600 hover:text-blue-600 mt-6" 
        onClick={() => navigate("/")} 
      > 
        ← Go to Home 
      </h2>
    </div>
  );
};
export default Signup;
