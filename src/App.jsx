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
            AI-powered requirements analysis
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-6xl font-semibold text-gray-900 leading-tight tracking-tight max-w-2xl mb-5">
          Detect ambiguity in your requirements
        </h1>

        {/* Subheading */}
        <p className="text-lg text-gray-500 max-w-lg leading-relaxed mb-10">
          Spot unclear, conflicting, or incomplete requirements before they cost
          you time and rework.
        </p>

        {/* CTA */}
        <div className="flex gap-5">
          <Link to="/signup">
            <Button variant="solid" size="lg">
              Start now
            </Button>
          </Link>
          <Link
            to="/demo">
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
