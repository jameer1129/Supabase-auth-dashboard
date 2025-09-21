import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Loader from "@/components/Loader";
import { useAuth } from "@/context/AuthContext";

const AdminDashboard = () => {
  const { profile: currentProfile, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState(null); // Track deletion

  useEffect(() => {
    if (authLoading) return;

    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .neq("role", "admin"); // Exclude admins

        if (error) {
          console.error("Error fetching users:", error);
          throw error;
        }
        setUsers(data || []);
      } catch (err) {
        toast.error(`Failed to fetch users: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentProfile, authLoading, navigate]);

  const handleDelete = async (userId) => {
  if (!window.confirm("Are you sure you want to delete this user?")) return;
  setDeletingUserId(userId);

  try {
    // Fetch files to delete from storage
    const { data: files, error: fileError } = await supabase
      .from("profiles")
      .select("profile_pic, resume")
      .eq("id", userId)
      .single();

    if (fileError) throw new Error(`Failed to fetch profile: ${fileError.message}`);

    // Delete files from storage if they exist
    if (files?.profile_pic) {
      const { error: picError } = await supabase.storage.from("profiles").remove([files.profile_pic]);
      if (picError) throw new Error(`Failed to delete profile picture: ${picError.message}`);
    }
    if (files?.resume) {
      const { error: resumeError } = await supabase.storage.from("profiles").remove([files.resume]);
      if (resumeError) throw new Error(`Failed to delete resume: ${resumeError.message}`);
    }

    // Delete user profile
    const { error: deleteError } = await supabase.from("profiles").delete().eq("id", userId);
    if (deleteError) throw new Error(`Failed to delete profile: ${deleteError.message}`);

    // Delete user from auth.users via Edge Function
    const { data: session } = await supabase.auth.getSession();
    const accessToken = session?.session?.access_token;
    if (!accessToken) throw new Error("No valid session or access token found");

    console.log("Deleting user with ID:", userId); // Debug log
    const response = await fetch(
      "https://agqovujbdthwbmxabozp.supabase.co/functions/v1/delete-user",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId }),
      }
    );
    const result = await response.json();
    console.log("Edge Function Response:", response.status, result); // Debug log
    if (!response.ok) throw new Error(result.error || "Failed to delete user from auth.users");

    setUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success("User deleted successfully!");
  } catch (err) {
    console.error("Delete user error:", err); // Log error for debugging
    toast.error(`Failed to delete user: ${err.message}`);
  } finally {
    setDeletingUserId(null);
  }
};

  if (loading || authLoading) return <Loader />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {deletingUserId && <Loader />}
      <div className="flex flex-wrap justify-around md:justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-center mb-2">Admin Dashboard - Manage Users</h1>
        <Button onClick={() => logout(navigate)}>Logout</Button>
      </div>
      <Card className="shadow-lg rounded-xl border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">User Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-gray-500">No users found. Check your RLS policies or create a new user profile.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="px-4 py-2 text-left font-semibold text-gray-700">Full Name</TableHead>
                    <TableHead className="px-4 py-2 text-left font-semibold text-gray-700">Email</TableHead>
                    <TableHead className="px-4 py-2 text-left font-semibold text-gray-700">Phone</TableHead>
                    <TableHead className="px-4 py-2 text-left font-semibold text-gray-700">Role</TableHead>
                    <TableHead className="px-4 py-2 text-left font-semibold text-gray-700">Updated At</TableHead>
                    <TableHead className="px-4 py-2 text-left font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(({ id, full_name, email, phone, role, updated_at }, idx) => (
                    <TableRow
                      key={id}
                      className={
                        idx % 2 === 0
                          ? "bg-white hover:bg-blue-50 transition"
                          : "bg-gray-50 hover:bg-blue-50 transition"
                      }
                    >
                      <TableCell className="px-4 py-2">{full_name || "N/A"}</TableCell>
                      <TableCell className="px-4 py-2">{email || "N/A"}</TableCell>
                      <TableCell className="px-4 py-2">{phone || "N/A"}</TableCell>
                      <TableCell className="px-4 py-2 capitalize">{role || "N/A"}</TableCell>
                      <TableCell className="px-4 py-2">
                        {updated_at ? new Date(updated_at).toLocaleString() : "N/A"}
                      </TableCell>
                      <TableCell className="px-4 py-2 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-500 text-blue-600 hover:bg-blue-100"
                          onClick={() => navigate(`/edit-profile/${id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="border-red-500 text-white hover:text-red-600  hover:bg-red-100"
                          disabled={deletingUserId === id}
                          onClick={() => handleDelete(id)}
                        >
                          {deletingUserId === id ? "Deleting..." : "Delete"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="text-center flex justify-center flex-col items-center mt-6">
        <img src="logo.png" alt="Logo" className="h-36 mr-2 " />
        <h2
          className="w-fit cursor-pointer border-b border-white transition-all duration-200 hover:border-b hover:border-black mt-6"
          onClick={() => navigate("/")}
        >
          ← Go to Home
        </h2>
      </div>
    </div>
  );
};

export default AdminDashboard;
