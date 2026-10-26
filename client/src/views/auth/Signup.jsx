
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import { setPageTitle } from "../../utils.jsx";
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

function Signup() {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const [googleCredential, setGoogleCredential] = useState("");
  const [googleProfile, setGoogleProfile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    invitationCode: "",
    collegeName: "",
    adminInvitationCode: "",
  });

  useEffect(() => {
    setPageTitle("Sign Up");

    // Resume registration if Login redirected a new Google user here.
    const pendingGoogle = location.state?.googleRegistration;

    if (pendingGoogle?.credential && pendingGoogle?.profile) {
      setGoogleCredential(pendingGoogle.credential);
      setGoogleProfile(pendingGoogle.profile);

      setForm((prev) => ({
        ...prev,
        name: pendingGoogle.profile.name || "",
        email: pendingGoogle.profile.email || "",
      }));

      setStep(2);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "role") {
      setCreatedCode("");
    }
  };

  const saveUserSession = (data) => {
    const user = data.user || {};
    const role = (user.role || data.role || "").toLowerCase();
    const userId = user.userId || user._id || user.id || data.userId;

    if (!data.token || !role || !userId) {
      throw new Error("The server returned incomplete account information.");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", role);
    localStorage.setItem("userId", String(userId));
    localStorage.setItem(
      "userData",
      JSON.stringify({
        ...user,
        id: String(userId),
        role,
      })
    );

    if (user.name) {
      localStorage.setItem("name", user.name);
    }

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

  // Step 1: Continue with Google.
  const handleGoogleAuthSuccess = (data) => {
    // Existing user: use their saved database role.
    if (!data.isNewUser) {
      try {
        saveUserSession(data);
        toast.success(data.message || "Login successful!");
      } catch (error) {
        toast.error(error.message);
      }
      return;
    }

    // New user: continue to Step 2 without creating the account yet.
    if (!data.googleCredential || !data.googleProfile) {
      toast.error(
        "Google verified, but registration information is missing. Please try again."
      );
      return;
    }

    setGoogleCredential(data.googleCredential);
    setGoogleProfile(data.googleProfile);

    setForm((prev) => ({
      ...prev,
      name: data.googleProfile.name || "",
      email: data.googleProfile.email || "",
      password: "",
    }));

    setStep(2);
    toast.success("Google verified! Complete your registration.");
  };

  // Step 1: Continue with email and password.
  const handleBasicDetailsSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error("Please enter your name, email and password.");
      return;
    }

    if (form.password.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    setStep(2);
  };

  // Step 2: Validate details and register.
  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();

    if (form.role === "admin") {
      if (
        !form.collegeName.trim() ||
        !form.adminInvitationCode.trim()
      ) {
        toast.error("Enter your college name and invitation code.");
        return;
      }
    } else if (!form.invitationCode.trim()) {
      toast.error("Enter your college invitation code.");
      return;
    }

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    if (!baseURL) {
      toast.error("VITE_API_BASE_URL is not configured.");
      return;
    }

    try {
      setLoading(true);
      setCreatedCode("");

      let endpoint;
      let payload;

      if (googleCredential) {
        endpoint = "/api/auth/google";

        payload = {
          credential: googleCredential,
          action: "register",
          role: form.role,
          ...(form.role === "admin"
            ? {
                collegeName: form.collegeName.trim(),
                adminInvitationCode: form.adminInvitationCode.trim(),
              }
            : {
                invitationCode: form.invitationCode.trim(),
              }),
        };
      } else if (form.role === "admin") {
        endpoint = "/api/auth/register/admin";

        payload = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          collegeName: form.collegeName.trim(),
          adminInvitationCode: form.adminInvitationCode.trim(),
        };
      } else {
        endpoint =
          form.role === "student"
            ? "/api/auth/register/student"
            : "/api/auth/register/alumni";

        payload = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          invitationCode: form.invitationCode.trim(),
        };
      }

      const response = await axios.post(
        `${baseURL}${endpoint}`,
        payload
      );

      const data = response.data;

      // Google registration should create the account and return a JWT.
      if (googleCredential) {
        saveUserSession(data);
        toast.success(data.message || "Registration successful!");
        return;
      }

      toast.success(data.message || "Registration successful!");

      if (form.role === "admin") {
        if (data.invitationCode) {
          setCreatedCode(data.invitationCode);
        } else {
          toast.error(
            "Registration succeeded, but the server did not return an invitation code."
          );
        }
      } else {
        navigate("/login", { replace: true });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelGoogleRegistration = () => {
    setGoogleCredential("");
    setGoogleProfile(null);
    setStep(1);

    setForm({
      name: "",
      email: "",
      password: "",
      role: "student",
      invitationCode: "",
      collegeName: "",
      adminInvitationCode: "",
    });
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
          <h1 className="mb-2 text-center text-3xl font-semibold text-green-700">
            {step === 1 ? "Create Account" : "Complete Registration"}
          </h1>

          <p className="mb-6 text-center text-sm text-gray-500">
            {step === 1
              ? "Join your college community on Alumni Nexus."
              : "Select your role and provide your college details."}
          </p>

          {/* STEP 1: Basic details or Google */}
          {step === 1 && (
            <>
              <form
                onSubmit={handleBasicDetailsSubmit}
                className="space-y-4"
              >
                <Input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />

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
                  placeholder="Create a password (min. 8 characters)"
                  value={form.password}
                  onChange={handleChange}
                  minLength={8}
                  required
                />

                <button
                  type="submit"
                  className="w-full rounded-lg bg-green-700 px-4 py-3 font-medium text-white transition hover:bg-green-800"
                >
                  Continue
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-sm text-gray-500">OR</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <GoogleSignInButton
                action="register"
                onSuccess={handleGoogleAuthSuccess}
                onError={(message) => toast.error(message)}
              />
            </>
          )}

          {/* STEP 2: Role and college details */}
          {step === 2 && (
            <>
              {googleCredential && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <p className="font-medium">Google account verified</p>
                  <p className="mt-1">
                    {googleProfile?.email || form.email}
                  </p>
                </div>
              )}

              <form
                onSubmit={handleRegistrationSubmit}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="role"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Select your role
                  </label>

                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  >
                    <option value="student">Student</option>
                    <option value="alumni">Alumni</option>
                    <option value="admin">College Admin</option>
                  </select>
                </div>

                {form.role === "student" && (
                  <>
                    <h2 className="font-semibold text-gray-800">
                      Student Registration
                    </h2>

                    <Input
                      type="text"
                      name="invitationCode"
                      placeholder="College invitation code"
                      value={form.invitationCode}
                      onChange={handleChange}
                      required
                    />

                    <p className="text-xs text-gray-500">
                      Enter the invitation code provided by your college
                      administrator.
                    </p>
                  </>
                )}

                {form.role === "alumni" && (
                  <>
                    <h2 className="font-semibold text-gray-800">
                      Alumni Registration
                    </h2>

                    <Input
                      type="text"
                      name="invitationCode"
                      placeholder="College invitation code"
                      value={form.invitationCode}
                      onChange={handleChange}
                      required
                    />

                    <p className="text-xs text-gray-500">
                      Enter the invitation code provided by your college
                      administrator.
                    </p>
                  </>
                )}

                {form.role === "admin" && (
                  <>
                    <h2 className="font-semibold text-gray-800">
                      College Admin Registration
                    </h2>

                    <Input
                      type="text"
                      name="collegeName"
                      placeholder="Enter college name"
                      value={form.collegeName}
                      onChange={handleChange}
                      required
                    />

                    <Input
                      type="text"
                      name="adminInvitationCode"
                      placeholder="Admin authorization / setup code"
                      value={form.adminInvitationCode}
                      onChange={handleChange}
                      required
                    />

                    <p className="text-xs text-gray-500">
                      Enter the authorized admin setup code. After successful
                      registration, the server can generate the college
                      invitation code to share with students and alumni.
                    </p>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-green-700 px-4 py-3 font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Please wait..."
                    : form.role === "admin"
                      ? "Create College Account"
                      : "Complete Registration"}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    if (googleCredential) {
                      cancelGoogleRegistration();
                    } else {
                      setStep(1);
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
              </form>
            </>
          )}

          {/* Show the generated college invitation code to the admin. */}
          {createdCode && (
            <div className="mt-5 rounded-lg border border-green-300 bg-green-50 p-4">
              <h2 className="font-semibold text-green-800">
                College registered successfully!
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Share this generated invitation code with your students and
                alumni.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-white p-3 text-lg font-bold text-green-800">
                  {createdCode}
                </code>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(createdCode);
                      toast.success("Code copied!");
                    } catch {
                      toast.error("Unable to copy code.");
                    }
                  }}
                  className="rounded-lg bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-800"
                >
                  Copy
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-4 w-full rounded-lg bg-green-700 px-4 py-3 font-medium text-white hover:bg-green-800"
              >
                Go to Login
              </button>
            </div>
          )}

          <p className="mt-5 text-center text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-green-700 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default Signup;
