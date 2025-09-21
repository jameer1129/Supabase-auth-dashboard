import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect } from "react";

// Helper: prepend Supabase storage URL if needed
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
  const { user, profile, loading, initializing, logout } = useAuth();
  const navigate = useNavigate();

  if (initializing || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">No profile found. Please log in.</p>
      </div>
    );
  }
  useEffect(() => {
    let timeoutId;
    if (profile.profile_complete === false && profile) {
        timeoutId = setTimeout(() => {
        toast.info("Please complete your profile");
        return navigate("/edit-profile");
      }, 100);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [profile]);
  // Parse JSON fields if needed
  let skills = profile.skills;
  let education = profile.education;
  let employment = profile.employment;
  let projects = profile.projects;
  try {
    if (typeof skills === "string") skills = JSON.parse(skills);
    if (typeof education === "string") education = JSON.parse(education);
    if (typeof employment === "string") employment = JSON.parse(employment);
    if (typeof projects === "string") projects = JSON.parse(projects);
  } catch (e) {
    // ignore parse errors
  }

  return (
    <div className="max-w-4xl mx-auto px-2 py-10">
      {/* Greeting */}
      <div className="flex flex-wrap justify-around md:justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Hi {profile.full_name || "User"} 👋
        </h1>
        <div className="space-x-6">
          <Button onClick={() => navigate("/edit-profile")}>Edit</Button>
          <Button onClick={() => logout(navigate)} variant="destructive">
            Logout
          </Button>
        </div>
      </div>
      <Card className=" flex flex-wrap flex-row space-x-6 items-center p-6 shadow-lg">
        <img
          src={getProfilePicUrl(profile.profile_pic)}
          alt="Profile"
          className="w-36 h-36 rounded-full object-cover border-4 border-blue-200 shadow-md"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/avatar.jpg";
          }}
        />
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {profile.full_name || "Unnamed User"}
          </h2>
          <p className="text-sm text-gray-500">{profile.email}</p>
          <p className="text-sm text-gray-500">{profile.phone}</p>
          <p className="text-gray-700">
            <strong>ID:</strong> {profile.id || "N/A"}
          </p>
          <p className="text-gray-700">
            <strong>Date of Birth:</strong> {profile.dob || "N/A"}
          </p>
          <p className="text-gray-700">
            <strong>Address:</strong>{" "}
            {profile.address
              ? `${profile.address.street || ""}, ${
                  profile.address.city || ""
                }, ${profile.address.state || ""}, ${
                  profile.address.country || ""
                } - ${profile.address.postal_code || ""}`
              : "N/A"}
          </p>
        </div>
      </Card>
      {/* Right column - Details */}
      <div className="mt-8 space-y-6">
        {/* Skills */}
        <Card className="p-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700">🛠 Skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {skills?.length > 0 ? (
              skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {typeof skill === "string" ? skill : skill.value}
                </span>
              ))
            ) : (
              <p className="text-gray-500">No skills added</p>
            )}
          </CardContent>
        </Card>
        {/* Education */}
        <Card className="p-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700">📚 Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {education?.length > 0 ? (
              education.map((edu, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-lg shadow-sm">
                  <p className="text-gray-700 font-medium">
                    {edu.college_name || edu.degree} -{" "}
                    {edu.branch || edu.institution}
                  </p>
                  <p className="text-sm text-gray-500">
                    {edu.start_year || " "} → {edu.end_year || "present"}
                  </p>
                  <p className="text-sm">
                    Percentage: {edu.percentage}%
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No education details</p>
            )}
          </CardContent>
        </Card>
        {/* Employment */}
        <Card className="p-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700">💼 Employment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {employment?.length > 0 ? (
              employment.map((job, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-lg shadow-sm">
                  <p className="text-gray-700 font-medium">
                    {job.company_name || job.company} -{" "}
                    {job.role || job.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {job.start_year || job.start_date} →{" "}
                    {job.end_year || job.end_date || "Present"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No employment details</p>
            )}
          </CardContent>
        </Card>
        {/* Projects */}
        <Card className="p-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700">🚀 Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects?.length > 0 ? (
              projects.map((proj, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-lg shadow-sm">
                  <p className="text-gray-700 font-medium">
                    {proj.project_name || proj.name}
                  </p>
                  <p className="text-sm text-gray-500">{proj.description}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No projects</p>
            )}
          </CardContent>
        </Card>
        {/* Resume */}
        <Card className="p-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700">📄 Resume</CardTitle>
          </CardHeader>
          <CardContent>
            {getResumeUrl(profile.resume) ? (
              <a
                href={getResumeUrl(profile.resume)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View Uploaded Resume
              </a>
            ) : (
              <p className="text-gray-500">No resume uploaded</p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="text-center flex justify-center">
        <h2
          className="w-fit cursor-pointer border-b border-white transition-all duration-200 hover:border-b hover:border-black mt-6"
          onClick={() => navigate("/")}
        >
          ← Go to Home
        </h2>
      </div>
    </div>
  );
}