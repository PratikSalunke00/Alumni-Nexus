
import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import { setPageTitle } from "../../utils.jsx";
import Input from "../../components/Input.jsx";
import backicon from "../../assets/back.png";

function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    invitationCode: "",
    collegeName: "",
    collegeAddress: "",
    adminInvitationCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setPageTitle("Sign Up");
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "role") {
      setCreatedCode("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    if (
      form.role === "admin" &&
      (!form.collegeName.trim() || !form.adminInvitationCode.trim())
    ) {
      toast.error("Enter your college name and create an invitation code.");
      return;
    }

    if (form.role !== "admin" && !form.invitationCode.trim()) {
      toast.error("Enter your college invitation code.");
      return;
    }

    try {
      setLoading(true);
      setCreatedCode("");

      const baseURL = import.meta.env.VITE_API_BASE_URL;

      if (!baseURL) {
        throw new Error("VITE_API_BASE_URL is not configured.");
      }

      let endpoint;
      let payload;

      if (form.role === "admin") {
        endpoint = "/api/auth/register/admin";

        payload = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          collegeName: form.collegeName.trim(),
          collegeAddress: form.collegeAddress.trim(),
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

      const res = await axios.post(`${baseURL}${endpoint}`, payload);

      toast.success(res.data.message || "Registration successful!");

      if (form.role === "admin") {
        const code = res.data.invitationCode;

        if (code) {
          setCreatedCode(code);
        } else {
          toast.error("Registration succeeded, but no code was returned.");
        }
      } else {
        setTimeout(() => navigate("/login"), 1000);
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

        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-md flex-col items-center rounded-xl border border-green-300 bg-white p-6 shadow-xl sm:p-8"
        >
          <h1 className="mb-2 text-3xl font-semibold text-green-700">
            Create Account
          </h1>

          <p className="mb-6 text-center text-sm text-gray-500">
            Join your college community on Alumni Nexus.
          </p>

          <div className="w-full space-y-4">
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

            <div>
              <label
                htmlFor="role"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Register as
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

            {form.role === "admin" ? (
              <>
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
                  name="collegeAddress"
                  placeholder="College address (optional)"
                  value={form.collegeAddress}
                  onChange={handleChange}
                />

                <Input
                  type="text"
                  name="adminInvitationCode"
                  placeholder="Create your college invitation code"
                  value={form.adminInvitationCode}
                  onChange={handleChange}
                  required
                />

                <p className="text-xs text-gray-500">
                  Create a code and share it with students and alumni from
                  your college. They will use it during registration.
                </p>
              </>
            ) : (
              <>
                <Input
                  type="text"
                  name="invitationCode"
                  placeholder="College invitation code"
                  value={form.invitationCode}
                  onChange={handleChange}
                  required
                />

                <p className="text-xs text-gray-500">
                  Enter the invitation code provided by your college admin.
                </p>
              </>
            )}

            <Input
              type="password"
              name="password"
              placeholder="Create a password (min. 8 characters)"
              value={form.password}
              onChange={handleChange}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-700 px-4 py-3 font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating account..."
                : form.role === "admin"
                  ? "Create College Account"
                  : "Sign Up"}
            </button>

            {createdCode && (
              <div className="rounded-lg border border-green-300 bg-green-50 p-4">
                <h2 className="font-semibold text-green-800">
                  College registered successfully!
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Share this invitation code with your students and alumni.
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
          </div>

          <p className="mt-5 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-green-700 hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default Signup;
