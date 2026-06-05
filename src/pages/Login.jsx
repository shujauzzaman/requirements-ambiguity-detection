import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/reusable/Button";

const LoginPage = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    loading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Agile Branding */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Req-Analyzer
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Sign in to refine your sprint backlog
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Error handling matrix */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            {/* Corporate/Work Email Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="po@company.com"
                required
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Password Security Node */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <span className="text-xs text-indigo-600 cursor-pointer hover:underline">
                  Forgot token?
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Pipeline Ingestion Trigger Button */}
            <Button
              type="submit"
              variant="solid"
              size="md"
              disabled={loading}
              className="w-full mt-1 justify-center"
            >
              {loading ? "Authenticating Engineer..." : "Open Workspace"}
            </Button>

          </form>
        </div>

        {/* Footer Interface Navigation */}
        <p className="text-center text-sm text-gray-500 mt-5">
          New to the requirement optimization engine?{" "}
          <Link to="/signup" className="text-indigo-600 font-medium hover:underline">
            Create Agile Workspace
          </Link>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;