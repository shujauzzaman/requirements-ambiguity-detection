import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/reusable/Button";

const SignupPage = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Security passwords do not match standard validation hashes.");
      return;
    }

    if (password.length < 6) {
      setError("Passphrase signature must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error, data } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data?.user?.identities?.length === 0) {
      setError("An operational profile with this email address is already verified. Please sign in.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  // Verification State View (Post-Signup Ingestion)
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verify your workspace token</h2>
          <p className="text-sm text-gray-500 mb-6">
            We sent a validation vector link to <span className="font-medium text-gray-700">{email}</span>. Confirm it to activate automated requirement scanning.
          </p>
          <Link to="/signin" className="text-sm text-indigo-600 font-medium hover:underline">
            Return to secure login terminal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Agile Branding */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Req-Analyzer
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Build clear, shift-left sprint requirements in seconds
          </p>
        </div>

        {/* Main Interface Entry Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Error Catch Zone */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            {/* Email Field Node */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pm@company.com"
                required
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Password Configuration */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Password Validation Double Check */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Ingestion Engine Sign up Submit */}
            <Button
              type="submit"
              variant="solid"
              size="md"
              disabled={loading}
              className="w-full mt-1 justify-center"
            >
              {loading ? "Initializing Workspace..." : "Provision Dashboard"}
            </Button>

          </form>
        </div>

        {/* Footer Redirect Zone */}
        <p className="text-center text-sm text-gray-500 mt-5">
          Already monitoring backlog ambiguity?{" "}
          <Link to="/signin" className="text-indigo-600 font-medium hover:underline">
            Log into Console
          </Link>
        </p>

      </div>
    </div>
  );
};

export default SignupPage;