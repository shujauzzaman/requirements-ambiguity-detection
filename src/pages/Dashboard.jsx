import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../auth/supabaseClient"; 
import Navbar from "../components/ui/Navbar";

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError("");

        // Fetch projects associated with the logged-in user
        const { data, error: fetchError } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        setProjects(data || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to sync your agile workspaces. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto py-12 px-6">
        
        {/* Dashboard Header Panel */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Projects</h1>
            <p className="text-gray-500 mt-1">Manage and refine your product backlogs.</p>
          </div>
          <Link to="/project/new" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-xs">
            + New Project
          </Link>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Dynamic Content Switching Engine */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-200 shadow-xs">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-gray-500 font-medium">Syncing requirements workspace...</p>
          </div>
        ) : projects.length > 0 ? (
          /* Project Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col justify-between hover:border-indigo-200 hover:shadow-md transition duration-200"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-3 mb-6">
                    {project.description || "No workspace description provided."}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <Link 
                    to={`/project/${project.id}`} 
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    Analyze Backlog &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State Placeholder fallback */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create a new project to start analyzing your user stories.</p>
            <Link to="/project/new" className="text-indigo-600 font-medium hover:text-indigo-700 inline-flex items-center gap-1">
              Create your first project &rarr;
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}