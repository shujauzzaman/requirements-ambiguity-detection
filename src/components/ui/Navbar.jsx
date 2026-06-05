import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Button from "../reusable/Button";
import { useNavigate } from "react-router-dom";

function Navbar() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const getInitials = (email) => {
        if (!email) return "?";
        return email.slice(0, 2).toUpperCase();
    };

    const handleSignOut = async () => {
        await signOut();
        navigate("/");   // redirect after async operation
    };

    return (
        <nav className="w-full border-b border-gray-200 bg-white">
            <div className="px-6 h-16 flex items-center justify-between">

                {/* Logo / Brand */}
                <span className="text-xl font-semibold text-gray-900">
                    Req-Analyzer
                </span>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {user ? (
                        // Logged in — show avatar + sign out
                        <div className="flex items-center gap-3">
                            <div
                                className="w-9 h-9 rounded-full bg-indigo-600 text-white text-sm font-medium flex items-center justify-center cursor-pointer select-none"
                                title={user.email}
                            >
                                {getInitials(user.email)}
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                            >
                                Sign out
                            </button>
                        </div>
                    ) : (
                        // Logged out — show login/signup buttons
                        <>
                            <Link to="/signin">
                                <Button variant="solid" size="md">
                                    Console
                                </Button>
                            </Link>
                            <Link to="/signup">
                                <Button variant="outline" size="md">
                                    Get Started
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

            </div>
        </nav>
    );
}

export default Navbar;