import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Loader from "@/components/Loader";
import { useAuth } from "@/context/AuthContext";
const EditProfile = () => {
  const { user: currentUser, profile: currentProfile } = useAuth();
  const { userId: targetUserId } = useParams();
  const isAdminEditingOther =
    targetUserId &&
    currentProfile?.role === "admin" &&
    targetUserId !== currentUser?.id;
  const effectiveUserId = isAdminEditingOther ? targetUserId : currentUser?.id;

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    dob: null,
    education: [],
    employment: [],
    projects: [],
    skills: [],
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
    },
    profile_pic: null,
    resume: null,
  });

  const [previewPic, setPreviewPic] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [dialogData, setDialogData] = useState({
    education: null,
    employment: null,
    projects: null,
    skills: null,
  });
  const [editingIndex, setEditingIndex] = useState({
    education: -1,
    employment: -1,
    projects: -1,
    skills: -1,
  });
  const [dialogOpen, setDialogOpen] = useState({
    education: false,
    employment: false,
    projects: false,
    skills: false,
  });
  const [oldProfilePicPath, setOldProfilePicPath] = useState(null);
  const [oldResumePath, setOldResumePath] = useState(null);

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
    (async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", effectiveUserId)
          .single();

        if (profileError) {
          throw new Error(`Failed to fetch profile: ${profileError.message}`);
        }
        if (profile) {
          setForm({
            full_name: profile.full_name || "User",
            email: profile.email || "",
            phone: profile.phone || "",
            dob: profile.dob || null,
            education: profile.education || [],
            employment: profile.employment || [],
            projects: profile.projects || [],
            skills: profile.skills || [],
            address:
              profile.address || {
                street: "",
                city: "",
                state: "",
                country: "",
                postal_code: "",
              },
            profile_pic: profile.profile_pic || null,
            resume: profile.resume || null,
          });
          setOldProfilePicPath(profile.profile_pic || null);
          setOldResumePath(profile.resume || null);
          if (profile.profile_pic) {
            const { data } = supabase.storage
              .from("profiles")
              .getPublicUrl(profile.profile_pic);
            setPreviewPic(data.publicUrl);
          }
          if (profile.resume) {
            const { data } = supabase.storage
              .from("profiles")
              .getPublicUrl(profile.resume);
            setResumeUrl(data.publicUrl);
          }
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentUser, currentProfile, effectiveUserId, navigate, isAdminEditingOther]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      if (!file) {
        toast.error("No file selected.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit.");
        return;
      }
      if (name === "profile_pic" && !file.type.startsWith("image/")) {
        toast.error("Profile picture must be an image.");
        return;
      }
      if (
        name === "resume" &&
        ![
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file.type)
      ) {
        toast.error("Resume must be a PDF or Word document.");
        return;
      }
      // Only update the relevant field, keep others intact
      setForm((prevForm) => ({
        ...prevForm,
        [name]: file,
      }));

      if (name === "profile_pic") {
        if (previewPic) URL.revokeObjectURL(previewPic);
        const newPreview = URL.createObjectURL(file);
        setPreviewPic(newPreview);
      }
      // Do not reset any other fields!
      return;
    } else if (name.includes("address.")) {
      const key = name.split(".")[1];
      setForm((prevForm) => ({
        ...prevForm,
        address: { ...prevForm.address, [key]: value },
      }));
    } else {
      setForm((prevForm) => ({ ...prevForm, [name]: value }));
    }
  };

  // Add or update array entries
  const addOrUpdateEntry = async (field, entry, index = -1) => {
    if (!entry || Object.values(entry).every((v) => (typeof v === "string" ? !v.trim() : !v))) {
      toast.error(`${field} cannot be empty`);
      return false;
    }

    let finalEntry = entry;
    if (field === "skills") {
      finalEntry = entry.value;
    }

    let updatedArray = [...form[field]];
    if (index >= 0) updatedArray[index] = finalEntry;
    else updatedArray.push(finalEntry);

    setForm((f) => ({ ...f, [field]: updatedArray }));

    const { error } = await supabase.from("profiles").update({ [field]: updatedArray }).eq("id", effectiveUserId);

    if (error) {
      toast.error(`Failed to update ${field}: ${error.message}`);
      return false;
    }

    toast.success(`${field} updated successfully!`);
    return true;
  };

  const deleteEntry = async (field, index) => {
    const newArray = [...form[field]];
    newArray.splice(index, 1);
    setForm((f) => ({ ...f, [field]: newArray }));

    const { error } = await supabase.from("profiles").update({ [field]: newArray }).eq("id", effectiveUserId);

    if (error) {
      toast.error(`Failed to delete ${field} entry: ${error.message}`);
      return;
    }
    toast.success("Deleted successfully!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate all required fields
      if (!form.full_name?.trim()) throw new Error("Full name is required.");
      if (!form.email?.trim()) throw new Error("Email is required.");
      if (!form.phone?.trim()) throw new Error("Phone is required.");
      if (!/^\d{10}$/.test(form.phone)) throw new Error("Phone must be 10 digits.");
      if (!form.dob) throw new Error("Date of birth is required.");
      if (!form.education.length) throw new Error("At least one education entry is required.");
      // if (!form.employment.length) throw new Error("At least one employment entry is required.");
      // if (!form.projects.length) throw new Error("At least one project entry is required.");
      // if (!form.skills.length) throw new Error("At least one skill is required.");
      if (!form.profile_pic) throw new Error("Profile picture is required.");
      if (!form.resume) throw new Error("Resume is required.");
      // All address fields must be filled
      if (!Object.values(form.address).every(Boolean))
        throw new Error("All address fields are required.");

      const profileData = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        dob: form.dob,
        education: form.education,
        employment: form.employment,
        projects: form.projects,
        skills: form.skills,
        address: form.address,
      };

      if (form.profile_pic && form.profile_pic instanceof File) {
        // Delete old profile pic if exists
        if (oldProfilePicPath && typeof oldProfilePicPath === "string" && oldProfilePicPath !== "") {
          await supabase.storage.from("profiles").remove([oldProfilePicPath]);
        }
        const ext = form.profile_pic.name.split(".").pop();
        const filePath = `profile_pics/${effectiveUserId}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("profiles")
          .upload(filePath, form.profile_pic, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Profile picture upload failed: ${uploadError.message}`);
        }

        profileData.profile_pic = filePath;
        setOldProfilePicPath(filePath);
        const { data: publicUrlData } = supabase.storage.from("profiles").getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          // Add cache buster
          setPreviewPic(publicUrlData.publicUrl + "?t=" + Date.now());
        }
        toast.success("Profile picture uploaded successfully!");
      }

      if (form.resume && form.resume instanceof File) {
        // Delete old resume if exists
        if (oldResumePath && typeof oldResumePath === "string" && oldResumePath !== "") {
          await supabase.storage.from("profiles").remove([oldResumePath]);
        }
        const ext = form.resume.name.split(".").pop();
        const filePath = `resumes/${effectiveUserId}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("profiles")
          .upload(filePath, form.resume, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Resume upload failed: ${uploadError.message}`);
        }

        profileData.resume = filePath;
        setOldResumePath(filePath);
        const { data: publicUrlData } = supabase.storage.from("profiles").getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          // Add cache buster
          setResumeUrl(publicUrlData.publicUrl + "?t=" + Date.now());
        }
        toast.success("Resume uploaded successfully!");
      }

      // After validation, set profile_complete to true
      profileData.profile_complete = true;

      const { error: updateError } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", effectiveUserId);

      if (updateError) {
        throw new Error(`Profile update failed: ${updateError.message}`);
      }

      if (!isAdminEditingOther) {
        await supabase.auth.updateUser({
          data: { full_name: profileData.full_name },
        });
      }

      toast.success("Profile updated successfully!");
      // Remove editMode logic
      // setEditMode(false); // <-- Add this line to exit edit mode after update
      setTimeout(() => navigate(isAdminEditingOther ? "/admin-dashboard" : "/user-dashboard"), 500);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Render dialog form for array fields
  const renderDialog = (field, fieldsConfig) => {
    return (
      <Dialog open={dialogOpen[field]} onOpenChange={(open) => setDialogOpen((prev) => ({ ...prev, [field]: open }))}>
        <DialogTrigger asChild>
          <Button
            type="button"
            onClick={() => {
              setEditingIndex((ei) => ({ ...ei, [field]: -1 }));
              setDialogData((d) => ({
                ...d,
                [field]: fieldsConfig.reduce((a, c) => ({ ...a, [c.name]: "" }), {}),
              }));
            }}
          >
            Add {field}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex[field] >= 0 ? `Edit ${field}` : `Add ${field}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {fieldsConfig.map((f) => (
              <div key={f.name} className="space-y-1">
                <label htmlFor={`${field}-${f.name}`} className="block text-sm font-medium text-gray-700">
                  {f.placeholder}
                </label>
                <Input
                  id={`${field}-${f.name}`}
                  type={f.type || "text"}
                  placeholder={
                    // Set e.g. placeholders for each field
                    f.name === "college_name" ? "e.g. MIT" :
                    f.name === "branch" ? "e.g. Computer Science" :
                    f.name === "percentage" ? "e.g. 85" :
                    f.name === "start_year" ? "e.g. 2020" :
                    f.name === "end_year" ? "e.g. 2024" :
                    f.name === "company_name" ? "e.g. Google" :
                    f.name === "role" ? "e.g. Software Engineer" :
                    f.name === "project_name" ? "e.g. Portfolio Website" :
                    f.name === "description" ? "e.g. Built a personal portfolio site" :
                    f.name === "duration" ? "e.g. 3 months" :
                    f.name === "value" ? "e.g. React.js" :
                    f.placeholder
                  }
                  value={dialogData[field]?.[f.name] || ""}
                  onChange={(e) =>
                    setDialogData((d) => ({
                      ...d,
                      [field]: { ...d[field], [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value },
                    }))
                  }
                />
              </div>
            ))}
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={async () => {
                  const success = await addOrUpdateEntry(field, dialogData[field], editingIndex[field]);
                  if (success) {
                    setEditingIndex((ei) => ({ ...ei, [field]: -1 }));
                    setDialogData((d) => ({ ...d, [field]: null }));
                    setDialogOpen((prev) => ({ ...prev, [field]: false }));
                  }
                }}
              >
                Save
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => setDialogOpen((prev) => ({ ...prev, [field]: false }))}>
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) return <Loader />;
  console.log(previewPic)
  return (
    <div className="min-h-screen bg-gradient-to-br px-2 py-10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-8 text-center">
          {isAdminEditingOther ? `Editing Profile for ${form.full_name}` : `Hi ${form.full_name}`}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Profile Picture */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-800 text-lg">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-center">
                <img src={previewPic ?? "/avatar.jpg"} alt="Profile preview" className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg" />
              </div>
              <Input
                type="file"
                name="profile_pic"
                accept="image/*"
                onChange={handleChange}
                className="file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200"
              />
            </CardContent>
          </Card>
          {/* User ID */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-800 text-lg">User ID</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                name="id"
                value={effectiveUserId || ""}
                placeholder="User ID"
                disabled
                readOnly
                className="bg-white"
              />
            </CardContent>
          </Card>
          {/* Full Name */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-800 text-lg">Full Name</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Full Name"
                required
                className="bg-white"
              />
            </CardContent>
          </Card>
          {/* Email */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-800 text-lg">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                name="email"
                value={form.email}
                placeholder="Email"
                disabled
                className="bg-gray-100"
              />
            </CardContent>
          </Card>
          {/* Phone */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-800 text-lg">Phone</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit phone number"
                className="bg-gray-100"
              />
            </CardContent>
          </Card>
          {/* DOB */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-800 text-lg">Date of Birth</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                name="dob"
                value={form.dob || ""}
                onChange={handleChange}
                required
                className="bg-gray-100"
              />
            </CardContent>
          </Card>
          {/* Education */}
          <Card className="shadow-lg">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-blue-800 text-lg">Education</CardTitle>
              {renderDialog("education", [
                { name: "college_name", placeholder: "College Name" },
                { name: "branch", placeholder: "Branch" },
                { name: "percentage", placeholder: "Percentage", type: "number" },
                { name: "start_year", placeholder: "Start Year", type: "number" },
                { name: "end_year", placeholder: "End Year", type: "number" },
              ])}
            </CardHeader>
            <CardContent>
              {form.education.length === 0 ? (
                <p className="text-gray-500">No education entries.</p>
              ) : (
                form.education.map((edu, i) => (
                  <div key={i} className="flex justify-between items-center mb-2 bg-white rounded px-3 py-2 shadow-sm">
                    <p>• {edu.college_name} - {edu.branch} ({edu.percentage}%, {edu.start_year}-{edu.end_year})</p>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-100"
                        onClick={() => {
                          setEditingIndex((ei) => ({ ...ei, education: i }));
                          setDialogData((d) => ({ ...d, education: form.education[i] }));
                          setDialogOpen((prev) => ({ ...prev, education: true }));
                        }}
                      >
                        Edit
                      </Button>
                      <Button type="button" variant="destructive" size="sm" className="hover:bg-red-100" onClick={() => deleteEntry("education", i)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                )))
              }
            </CardContent>
          </Card>
          {/* Employment */}
          <Card className="shadow-lg">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-blue-800 text-lg">Employment</CardTitle>
              {renderDialog("employment", [
                { name: "company_name", placeholder: "Company Name" },
                { name: "role", placeholder: "Role" },
                { name: "start_year", placeholder: "Start Year", type: "number" },
                { name: "end_year", placeholder: "End Year", type: "number" },
              ])}
            </CardHeader>
            <CardContent>
              {form.employment.length === 0 ? (
                <p className="text-gray-500">No employment entries.</p>
              ) : (
                form.employment.map((emp, i) => (
                  <div key={i} className="flex justify-between items-center mb-2 bg-white rounded px-3 py-2 shadow-sm">
                    <p>• {emp.company_name} - {emp.role} ({emp.start_year}-{emp.end_year})</p>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-100"
                        onClick={() => {
                          setEditingIndex((ei) => ({ ...ei, employment: i }));
                          setDialogData((d) => ({ ...d, employment: form.employment[i] }));
                          setDialogOpen((prev) => ({ ...prev, employment: true }));
                        }}
                      >
                        Edit
                      </Button>
                      <Button type="button" variant="destructive" size="sm" className="hover:bg-red-100" onClick={() => deleteEntry("employment", i)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          {/* Projects */}
          <Card className="shadow-lg">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-blue-800 text-lg">Projects</CardTitle>
              {renderDialog("projects", [
                { name: "project_name", placeholder: "Project Name" },
                { name: "description", placeholder: "Description" },
                { name: "duration", placeholder: "Duration (e.g. 3 months)" },
              ])}
            </CardHeader>
            <CardContent>
              {form.projects.length === 0 ? (
                <p className="text-gray-500">No project entries.</p>
              ) : (
                form.projects.map((proj, i) => (
                  <div key={i} className="flex justify-between items-center mb-2 bg-white rounded px-3 py-2 shadow-sm">
                    <p>
                      • {proj.project_name}: {proj.description}
                      {proj.duration && <> (Duration: {proj.duration})</>}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-100"
                        onClick={() => {
                          setEditingIndex((ei) => ({ ...ei, projects: i }));
                          setDialogData((d) => ({ ...d, projects: form.projects[i] }));
                          setDialogOpen((prev) => ({ ...prev, projects: true }));
                        }}
                      >
                        Edit
                      </Button>
                      <Button type="button" variant="destructive" size="sm" className="hover:bg-red-100" onClick={() => deleteEntry("projects", i)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          {/* Skills */}
          <Card className="shadow-lg">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-blue-800 text-lg">Skills</CardTitle>
              {renderDialog("skills", [{ name: "value", placeholder: "Skill Name" }])}
            </CardHeader>
            <CardContent>
              {form.skills.length === 0 ? (
                <p className="text-gray-500">No skills.</p>
              ) : (
                form.skills.map((skill, i) => (
                  <div key={i} className="flex justify-between items-center mb-2 bg-white rounded px-3 py-2 shadow-sm">
                    <p>• {skill}</p>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-100"
                        onClick={() => {
                          setEditingIndex((ei) => ({ ...ei, skills: i }));
                          setDialogData((d) => ({ ...d, skills: { value: form.skills[i] } }));
                          setDialogOpen((prev) => ({ ...prev, skills: true }));
                        }}
                      >
                        Edit
                      </Button>
                      <Button type="button" variant="destructive" size="sm" className="hover:bg-red-100" onClick={() => deleteEntry("skills", i)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          {/* Address */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-800 text-lg">Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "street", label: "Street", placeholder: "e.g. 123 Main St" },
                  { key: "city", label: "City", placeholder: "e.g. New York" },
                  { key: "state", label: "State", placeholder: "e.g. NY" },
                  { key: "country", label: "Country", placeholder: "e.g. USA" },
                  { key: "postal_code", label: "Postal Code", placeholder: "e.g. 10001" }
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label
                      htmlFor={`address-${key}`}
                      className="block mb-1 text-sm font-medium text-gray-700"
                    >
                      {label}
                    </label>
                    <Input
                      id={`address-${key}`}
                      name={`address.${key}`}
                      value={form.address[key]}
                      placeholder={placeholder}
                      onChange={handleChange}
                      className="bg-gray-100"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Resume Upload */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-800 text-lg">Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="file"
                name="resume"
                accept=".pdf,.doc,.docx"
                onChange={handleChange}
                className="file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200"
              />
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 underline block mt-2"
                >
                  View Resume
                </a>
              )}
            </CardContent>
          </Card>
          {/* Update and Cancel buttons */}
          <div className="flex flex-wrap flex-row justify-around gap-4 mt-4">
            <Button
              type="button"
              variant="outline"
              className="py-4"
              onClick={() => navigate(isAdminEditingOther ? "/admin-dashboard" : "/user-dashboard")}
              disabled={loading  || !currentProfile.profile_complete}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="py-4"
            >
              {loading ? "Saving..." : "Update Profile"}
            </Button>
          </div>
        </form>
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
};

export default EditProfile;