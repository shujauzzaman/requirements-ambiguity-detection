import { Link } from "react-router-dom";
import Button from "./components/reusable/Button";
import Navbar from "./components/ui/Navbar";

function App() {
  return (
    <>
      <Navbar />
      <section className="w-full bg-white py-24 px-6 flex flex-col items-center text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-base font-medium text-indigo-700 tracking-wide">
            AI-powered backlog refinement
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-6xl font-semibold text-gray-900 leading-tight tracking-tight mx-auto mb-5">
          Stop <span className="text-red-600"><i>ambiguous</i></span> user stories before sprint planning
        </h1>

        {/* Subheading */}
        <p className="text-lg text-gray-500 max-w-xl leading-relaxed mb-10">
          Upload your product backlog to instantly detect vague requirements, flag untestable criteria, and generate developer-ready user story rewrites.
        </p>

        {/* CTA */}
        <div className="flex gap-5">
          <Link to="/signup">
            <Button variant="solid" size="lg">
              Analyze your backlog
            </Button>
          </Link>
          <Link to="/demo">
            <Button variant="outline" size="lg">
              Quick demo
            </Button>
          </Link> 
        </div>

      </section>
    </>
  );
}

export default App;