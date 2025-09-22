import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import { supabase } from "@/supabaseClient";
import {
  User,         // 👤 Full name
  Mail,         // 📧 Email
  Phone,        // 📱 Phone
  Calendar,     // 📅 Date of Birth
  GraduationCap,// 🎓 Education
  Briefcase,    // 💼 Employment
  FolderKanban, // 📂 Projects
  Star,         // ⭐ Skills
  Home,         // 🏠 Address
  FileText,     // 📄 Resume
  Image,        // 🖼️ Profile Pic
  Save,         // 💾 Save button
} from "lucide-react";

// Supabase storage URL
const supabaseStorageUrl =
  "https://agqovujbdthwbmxabozp.supabase.co/storage/v1/object/public/profiles/";

function getProfilePicUrl(url) {
  if (!url) return "/default-avatar.png";
  if (url.startsWith("http")) return url;
  return supabaseStorageUrl + url;
}

function getResumeUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return supabaseStorageUrl + url;
}

export default function UserDashboard() {
  const { user: currentUser, profile: currentProfile, loading: authLoading, initializing: authInitializing, logout } = useAuth();
  const navigate = useNavigate();
  const { userId: targetUserId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdminEditingOther = targetUserId && currentProfile?.role === "admin" && targetUserId !== currentUser?.id;
  const effectiveUserId = isAdminEditingOther ? targetUserId : currentUser?.id;

  // Fetch profile
  useEffect(() => {
    if (!currentUser) {
      navigate("/signin");
      return;
    }

    if (isAdminEditingOther && currentProfile?.role !== "admin") {
      toast.error("Unauthorized access.");
      navigate("/");
      return;
    }

    let mounted = true;
    let timeoutId;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        let profileData = currentProfile;

        if (isAdminEditingOther) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", effectiveUserId)
            .single();
          if (error) throw new Error(error.message);
          profileData = data;
        }

        if (!mounted) return;

        const normalized = {
          full_name: profileData.full_name || "User",
          email: profileData.email || "",
          phone: profileData.phone || "",
          dob: profileData.dob || null,
          education: typeof profileData.education === "string" ? JSON.parse(profileData.education) : profileData.education || [],
          employment: typeof profileData.employment === "string" ? JSON.parse(profileData.employment) : profileData.employment || [],
          projects: typeof profileData.projects === "string" ? JSON.parse(profileData.projects) : profileData.projects || [],
          skills: typeof profileData.skills === "string" ? JSON.parse(profileData.skills) : profileData.skills || [],
          address: profileData.address || { street: "", city: "", state: "", country: "", postal_code: "" },
          profile_pic: profileData.profile_pic || null,
          resume: profileData.resume || null,
          profile_complete: profileData.profile_complete,
        };

        setProfile(normalized);

        if (!isAdminEditingOther && !normalized.profile_complete) {
          timeoutId = setTimeout(() => {
            toast.info("Please complete your profile");
            navigate("/edit-profile");
          }, 100);
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentUser, currentProfile, effectiveUserId, isAdminEditingOther, navigate]);

  const isLoading = loading || authLoading || authInitializing;

  if (isLoading) return <Loader />;

  if (!currentUser || !profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">No profile found. Please log in.</p>
      </div>
    );
  }

  // Render Card sections
  const renderCardList = (title, items, renderItem, emptyMessage) => (
    <Card className="p-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-blue-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items?.length > 0 ? items.map(renderItem) : <p className="text-gray-500">{emptyMessage}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto px-2 py-10">
      {/* Greeting */}
      <div className="flex flex-wrap justify-around md:justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {isAdminEditingOther ? `${profile.full_name} Profile Viewing` : `👋 Hi ${profile.full_name}`}
        </h1>
        <div className="space-x-6">
          <Button
            onClick={() =>
              isAdminEditingOther ? navigate(`/edit-profile/${targetUserId}`) : navigate("/edit-profile")
            }
          >
            Edit
          </Button>
          <Button onClick={() => logout(navigate)} variant="destructive">
            Logout
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="flex flex-wrap flex-row space-x-6 items-center p-6 shadow-lg">
        <img
          src={getProfilePicUrl(profile.profile_pic)}
          alt="Profile"
          className="w-36 h-36 rounded-full object-cover border-4 border-blue-200 shadow-md"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/default-avatar.png";
          }}
        />
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{profile.full_name || "Unnamed User"}</h2>
          <p className="text-sm text-gray-500">{profile.email}</p>
          <p className="text-sm text-gray-500">{profile.phone}</p>
          <p className="text-gray-700"><strong>ID:</strong> {effectiveUserId || "N/A"}</p>
          <p className="text-gray-700"><strong>Date of Birth:</strong> {profile.dob || "N/A"}</p>
          <p className="text-gray-700">
            <strong>Address:</strong>{" "}
            {`${profile.address?.street || ""}, ${profile.address?.city || ""}, ${profile.address?.state || ""}, ${profile.address?.country || ""} - ${profile.address?.postal_code || ""}`}
          </p>
        </div>
      </Card>

      {/* Details */}
      <div className="mt-8 space-y-6">
        {renderCardList(
          "🛠 Skills",
          profile.skills,
          (skill, i) => (
            <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {typeof skill === "string" ? skill : skill.value}
            </span>
          ),
          "No skills added"
        )}

        {renderCardList(
          "📚 Education",
          profile.education,
          (edu, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-lg shadow-sm">
              <p className="text-gray-700 font-medium">{edu.college_name || edu.degree} - {edu.branch || edu.institution}</p>
              <p className="text-sm text-gray-500">{edu.start_year || " "} → {edu.end_year || "Present"}</p>
              <p className="text-sm">Percentage: {edu.percentage}%</p>
            </div>
          ),
          "No education details"
        )}

        {renderCardList(
          "💼 Employment",
          profile.employment,
          (job, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-lg shadow-sm">
              <p className="text-gray-700 font-medium">{job.company_name || job.company} - {job.role || job.title}</p>
              <p className="text-sm text-gray-500">{job.start_year || job.start_date} → {job.end_year || job.end_date || "Present"}</p>
            </div>
          ),
          "No employment details"
        )}

        {renderCardList(
          "🚀 Projects",
          profile.projects,
          (proj, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-lg shadow-sm">
              <p className="text-gray-700 font-medium">{proj.project_name || proj.name}</p>
              <p className="text-sm text-gray-500">{proj.description}</p>
            </div>
          ),
          "No projects"
        )}

        {/* Resume */}
        <Card className="p-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700">📄 Resume</CardTitle>
          </CardHeader>
          <CardContent>
            {getResumeUrl(profile.resume) ? (
              <a href={getResumeUrl(profile.resume)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                View Uploaded Resume
              </a>
            ) : (
              <p className="text-gray-500">No resume uploaded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="text-center flex justify-around p-4 mt-6">
        <h2
          className="w-fit cursor-pointer border-b border-white transition-all duration-200 hover:border-b hover:border-blue-600 hover:text-blue-600"
          onClick={() => navigate(isAdminEditingOther ? "/admin-dashboard" : "/")}
        >
          ← Go {isAdminEditingOther ? "to Admin" : "to Home"}
        </h2>
      </div>
    </div>
  );
}
