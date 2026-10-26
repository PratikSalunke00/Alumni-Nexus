
import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import { setPageTitle, isUserLoggedIn } from "../../utils.jsx";
import Input from "../../components/Input.jsx";
import backicon from "../../assets/back.png";
import GoogleSignInButton from "../../components/GoogleSignInButton.jsx";

function getDashboardPath(role) {
  switch (role?.toLowerCase()) {
    case "student":
      return "/student/dashboard";
    case "alumni":
      return "/alumni/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/login";
  }
}

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setPageTitle("Login");

    if (isUserLoggedIn()) {
      const storedUser = JSON.parse(
        localStorage.getItem("userData") || "{}"
      );

      const role = localStorage.getItem("role") || storedUser.role;

      navigate(getDashboardPath(role), { replace: true });
    }
  }, [navigate]);

  const saveUserSession = (data) => {
    const user = data.user || {};
    const role = (user.role || data.role || "").toLowerCase();
    const userId = user.userId || user._id || user.id || data.userId;
    const token = data.token;
    const name = user.name || data.name;

    if (!token || !role || !userId) {
      throw new Error("The server returned incomplete login information.");
    }

    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("userId", String(userId));

    if (name) {
      localStorage.setItem("name", name);
    }

    localStorage.setItem(
      "userData",
      JSON.stringify({
        ...user,
        id: String(userId),
        role,
        name,
      })
    );

    const collegeId =
      typeof user.collegeId === "object"
        ? user.collegeId?._id
        : user.collegeId;

    if (collegeId) {
      localStorage.setItem("collegeId", String(collegeId));
    } else {
      localStorage.removeItem("collegeId");
    }

    navigate(getDashboardPath(role), { replace: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password) {
      toast.error("Please enter your email and password.");
      return;
    }

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    if (!baseURL) {
      toast.error("VITE_API_BASE_URL is not configured.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${baseURL}/api/auth/login`,
        {
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }
      );

      saveUserSession(response.data);

      toast.success(response.data.message || "Login successful!");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuthSuccess = (data) => {
    // A new Google user has no saved role/account yet.
    if (data.isNewUser) {
      if (!data.googleCredential || !data.googleProfile) {
        toast.error(
          "Google registration information is missing. Please try again."
        );
        return;
      }

      navigate("/signup", {
        state: {
          googleRegistration: {
            credential: data.googleCredential,
            profile: data.googleProfile,
          },
        },
        replace: true,
      });

      toast.success("Google verified. Please complete registration.");
      return;
    }

    // Existing users are redirected using their database role.
    try {
      saveUserSession(data);
      toast.success(data.message || "Google login successful!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-slate-100 to-teal-50">
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <Link to="/" aria-label="Back to home">
          <img
            src={backicon}
            alt="Back"
            className="fixed left-6 top-6 h-8 cursor-pointer transition duration-200 hover:scale-110"
          />
        </Link>

        <div className="w-full max-w-md rounded-xl border border-green-300 bg-white p-6 shadow-xl sm:p-8">
          <h1 className="mb-7 text-center text-3xl font-semibold text-green-700">
            Login
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <Input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-700 px-4 py-3 font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm text-gray-500">OR</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <GoogleSignInButton
            action="login"
            onSuccess={handleGoogleAuthSuccess}
            onError={(message) => toast.error(message)}
          />

          <p className="mt-5 text-center text-sm">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-green-700 hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default Login;
