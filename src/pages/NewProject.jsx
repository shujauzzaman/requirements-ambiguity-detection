import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import Button from '../components/reusable/Button';
import { supabase } from '../auth/supabaseClient'; 

export default function NewProject() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('General SaaS / Enterprise Software');
  const [customDomain, setCustomDomain] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Determine the final domain string to send to Supabase
    const finalDomain = domain === 'Other' ? customDomain.trim() : domain;
    
    // Safety check if they selected Other but left the text box empty
    if (domain === 'Other' && !finalDomain) {
      setError('Please specify your custom business domain.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('projects')
        .insert([{ name, domain: finalDomain, description }])
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      navigate(`/project/${data.id}`);
    } catch (err) {
      setError(err.message || 'Something went wrong creating the project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl w-full mx-auto py-12 px-6">
        
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Create New Project</h1>
          <p className="text-gray-500 mt-1">Set up your context workspace to help the AI better evaluate system constraints.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {/* Project Name Input */}
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="projectName"
                required
                disabled={loading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Core Banking Platform, E-Store Mobile App"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow disabled:bg-gray-50"
              />
            </div>

            {/* Business Domain Dropdown */}
            <div>
              <label htmlFor="projectDomain" className="block text-sm font-medium text-gray-700 mb-2">
                Business Domain <span className="text-red-500">*</span>
              </label>
              <select
                id="projectDomain"
                disabled={loading}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow disabled:bg-gray-50"
              >
                <option value="General SaaS / Enterprise Software">General SaaS / Enterprise Software</option>
                <option value="Fintech / Banking / Crypto">Fintech / Banking / Crypto</option>
                <option value="Healthcare / MedTech / Life Sciences">Healthcare / MedTech / Life Sciences</option>
                <option value="E-commerce / Retail / Marketplace">E-commerce / Retail / Marketplace</option>
                <option value="Logistics / Supply Chain / Mobility">Logistics / Supply Chain / Mobility</option>
                <option value="Cybersecurity / Compliance">Cybersecurity / Compliance</option>
                <option value="AI / Data Analytics Platforms">AI / Data Analytics Platforms</option>
                <option value="EdTech / Education / E-Learning">EdTech / Education / E-Learning</option>
                <option value="Entertainment / Media / Streaming">Entertainment / Media / Streaming</option>
                <option value="GovTech / Public Sector">GovTech / Public Sector</option>
                <option value="PropTech / Real Estate">PropTech / Real Estate</option>
                <option value="Other">Other (Specify...)</option>
              </select>

              {/* Conditional Custom Domain Input Text Bar */}
              {domain === 'Other' && (
                <div className="mt-3 transition-all duration-200 ease-in-out">
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="Specify your industry (e.g., AgriTech, DeepTech, Aerospace)"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow disabled:bg-gray-50"
                  />
                </div>
              )}

              <p className="mt-1.5 text-xs text-gray-400">
                Providing domain context helps the background model detect contextual contradictions accurately.
              </p>
            </div>

            {/* Optional Description Textarea */}
            <div>
              <label htmlFor="projectDesc" className="block text-sm font-medium text-gray-700 mb-2">
                Project Description <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                id="projectDesc"
                rows={4}
                disabled={loading}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the purpose of this project scope..."
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow disabled:bg-gray-50 resize-none"
              />
            </div>

            {/* Submit Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <Button
                type="submit"
                variant="solid"
                disabled={loading || !name.trim() || (domain === 'Other' && !customDomain.trim())}
                className="px-5 py-2.5 text-sm"
              >
                {loading ? 'Creating workspace...' : 'Initialize Project'}
              </Button>
            </div>

          </form>
        </div>

      </main>
    </div>
  );
}