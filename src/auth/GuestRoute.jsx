// GuestRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/chat" replace />;
  }

  return children;
};

export default GuestRoute;