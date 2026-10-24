import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import Heading from "../components/Heading";

const emptyProfile = {
  name: "",
  email: "",
  mobile: "",
  city: "",
  country: "",
  department: "",
  branch: "",
  graduationYear: "",
  company: "",
  designation: "",
  bio: "",
  skills: "",
  github: "",
  linkedin: "",
  portfolio: "",
  profileVisibility: "public",
};

function Profile() {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("userJwtToken");
    if (!token) {
      setError("Please log in to view your profile");
      setLoading(false);
      return;
    }

    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const user = response.data?.data || {};
        setProfile({
          ...emptyProfile,
          ...user,
          skills: Array.isArray(user.skills) ? user.skills.join(", ") : "",
        });
      })
      .catch(() => {
        setError("Unable to load profile right now");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("userJwtToken");

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/profile/me`,
        {
          ...profile,
          skills: profile.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem("userData", JSON.stringify(response.data.data));
      alert("Profile updated successfully");
    } catch (requestError) {
      alert(requestError.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Heading text="My Profile" />

        {loading ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Loading profile...</div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input name="name" value={profile.name} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input name="email" value={profile.email} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Mobile</label>
              <input name="mobile" value={profile.mobile} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">City</label>
              <input name="city" value={profile.city} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Country</label>
              <input name="country" value={profile.country} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Department</label>
              <input name="department" value={profile.department} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Branch</label>
              <input name="branch" value={profile.branch} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Graduation Year</label>
              <input type="number" name="graduationYear" value={profile.graduationYear} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Skills</label>
              <input name="skills" value={profile.skills} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Bio</label>
              <textarea name="bio" value={profile.bio} onChange={handleChange} className="min-h-24 w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Company</label>
              <input name="company" value={profile.company} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Designation</label>
              <input name="designation" value={profile.designation} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">GitHub</label>
              <input name="github" value={profile.github} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">LinkedIn</label>
              <input name="linkedin" value={profile.linkedin} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Portfolio</label>
              <input name="portfolio" value={profile.portfolio} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Profile visibility</label>
              <select name="profileVisibility" value={profile.profileVisibility} onChange={handleChange} className="w-full rounded-xl border border-slate-200 p-3">
                <option value="public">Public</option>
                <option value="college">College</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button title="Save profile" type="submit" varient="primary" />
            </div>
          </form>
        )}
      </div>
      <Footer />
    </>
  );
}

export default Profile;