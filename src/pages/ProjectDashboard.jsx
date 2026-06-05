import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../auth/supabaseClient';
import Navbar from '../components/ui/Navbar';
import DashboardRequirementCard from '../components/DashboardRequirementCard'; // ◄ Imported Child Element

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // Data States
  const [batches, setBatches] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI Interactive States
  const [expandedBatchId, setExpandedBatchId] = useState(null);
  const [expandedReqId, setExpandedReqId] = useState(null);
  const [visibleCounts, setVisibleCounts] = useState({});

  // Fetch all associated pipeline metrics logs
  async function loadDashboardData() {
    try {
      const { data: batchData, error: batchErr } = await supabase
        .from('batches')
        .select('*')
        .eq('project_id', projectId)
        .order('batch_number', { ascending: false });

      if (batchErr) throw batchErr;

      const { data: reqData, error: reqErr } = await supabase
        .from('requirements')
        .select('*')
        .eq('project_id', projectId);

      if (reqErr) throw reqErr;

      setBatches(batchData || []);
      setRequirements(reqData || []);
      
      if (batchData && batchData.length > 0 && !expandedBatchId) {
        setExpandedBatchId(batchData[0].id);
      }
    } catch (err) {
      console.error("Error aggregating analytical layers:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) loadDashboardData();
  }, [projectId]);

  // Global Statistics Calculators
  const totalCount = requirements.length;
  const ambiguousCount = requirements.filter(r => r.is_ambiguous && r.status !== 'approved').length;
  const clearCount = totalCount - ambiguousCount;

  const handleShowMore = (batchId) => {
    setVisibleCounts(prev => ({
      ...prev,
      [batchId]: (prev[batchId] || 20) + 20
    }));
  };

  const handleExportBatchCSV = (batch) => {
    // 1. Grab all requirements belonging to this specific batch
    const batchReqs = requirements.filter(r => r.batch_id === batch.id);
    
    if (batchReqs.length === 0) {
      alert("No requirements found to export for this batch.");
      return;
    }

    // 2. Define standard Jira CSV Headers
    const headers = ['Issue Type', 'Summary', 'Description', 'ReqAnalyzer Status'];
    
    // 3. Transform rows into escaped CSV strings
    const csvRows = batchReqs.map(req => {
      const issueType = 'Story';
      
      // Use refined version if approved, otherwise fall back to original text
      const summary = req.status === 'approved' && req.improved_version 
        ? req.improved_version 
        : req.story_text;

      // Compile a rich description block for the developers
      let description = `Original Ingested Story:\n"${req.story_text}"\n\n`;
      if (req.is_ambiguous) {
        description += `⚠️ AI FLAW ANALYSIS:\n${req.explanation || 'N/A'}\n\n`;
        if (req.clarification_questions && req.clarification_questions.length > 0) {
          description += `❓ CLARIFICATION QUESTIONS:\n${req.clarification_questions.join('\n')}`;
        }
      } else {
        description += `✅ Base requirement verified clean by ReqAnalyzer optimization weights.`;
      }

      const reqAnalyzerStatus = req.status === 'approved' ? 'Approved & Refined' : 'Passed Clear';

      // Helper to safely escape double quotes and commas for CSV standards
      const escapeCSV = (text) => {
        if (!text) return '""';
        const formatted = text.toString().replace(/"/g, '""');
        return `"${formatted}"`;
      };

      return [
        escapeCSV(issueType),
        escapeCSV(summary),
        escapeCSV(description),
        escapeCSV(reqAnalyzerStatus)
      ].join(',');
    });

    // 4. Combine headers and rows with newlines
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // 5. Create a client-side downloadable Blob object
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 6. Programmatically trigger the browser save dialog
    const link = document.createElement('a');
    link.href = url;
    
    // Format target file name cleanly: e.g., "req-analyzer-export-user_stories_backlog.csv"
    const sanitizedFileName = batch.file_name ? batch.file_name.replace(/\.csv$/i, '') : `batch-${batch.batch_number}`;
    link.setAttribute('download', `req-analyzer-export-${sanitizedFileName}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 animate-pulse font-medium">Compiling dynamic metrics matrix...</p>
        </div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased text-gray-950">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-6">
        
        {/* Action Bar Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Req-Analyzer Analytics Engine</h1>
            <p className="text-sm text-gray-500">Traceability audit logs and semantic ambiguity scorecards</p>
          </div>
          <button 
            onClick={() => navigate(`/project/${projectId}`)}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-xs hover:bg-gray-50 transition cursor-pointer"
          >
            &larr; Upload New Batch File
          </button>
        </div>

        {/* Global Executive Overview Widgets */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Evaluated Scope</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalCount} <span className="text-xs font-normal text-gray-400">stories</span></p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Flawed Base Material</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {ambiguousCount} 
              <span className="text-xs font-normal text-red-400 ml-2">({totalCount ? Math.round((ambiguousCount/totalCount)*100) : 0}%)</span>
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Clear Action Blocks</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">
              {clearCount}
              <span className="text-xs font-normal text-emerald-400 ml-2">({totalCount ? Math.round((clearCount/totalCount)*100) : 0}%)</span>
            </p>
          </div>
        </div>

        {/* Historical Batch Processing Ledger */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">Historical Source Batches</h2>
        {batches.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
            No history segments found. Upload a requirements dataset configuration to populate logs.
          </div>
        ) : (
          <div className="space-y-4">
            {batches.map((batch) => {
              const batchReqs = requirements.filter(r => r.batch_id === batch.id);
              const batchAmbiguous = batchReqs.filter(r => r.is_ambiguous && r.status !== 'approved').length;
              const isBatchExpanded = expandedBatchId === batch.id;
              
              const limit = visibleCounts[batch.id] || 20;
              const paginatedReqs = batchReqs.slice(0, limit);

              return (
                <div key={batch.id} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden transition">
                  
                  {/* Collapsible Batch Summary Card Trigger */}
                  <div 
                    onClick={() => setExpandedBatchId(isBatchExpanded ? null : batch.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/70 select-none border-b border-transparent data-[expanded=true]:border-gray-100 transition"
                    data-expanded={isBatchExpanded}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-700 border border-gray-200">
                        #{batch.batch_number}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{batch.file_name}</h3>
                        <p className="text-xs text-gray-400">{new Date(batch.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex gap-4 text-xs font-medium">
                        <span className="text-gray-500">Total: <strong>{batchReqs.length}</strong></span>
                        <span className="text-red-600">Ambiguous: <strong>{batchAmbiguous}</strong></span>
                        <span className="text-emerald-600">Clear: <strong>{batchReqs.length - batchAmbiguous}</strong></span>
                      </div>
                      {/* NEW EXPORT ACTION BUTTON NODE */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // ◄ Prevents the accordion panel from toggling open/close when downloading
                          handleExportBatchCSV(batch);
                        }}
                        className="px-3 py-1.5 bg-gray-900 hover:bg-indigo-600 text-white font-semibold text-xs rounded-md transition duration-150 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        Export to Jira
                      </button>
                      <span className="text-gray-400 text-sm transition-transform duration-200">
                        {isBatchExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Requirement View Area */}
                  {isBatchExpanded && (
                    <div className="bg-gray-50/40 p-5 border-t border-gray-100 space-y-3">
                      {batchReqs.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No logged requirements map to this structural index partition.</p>
                      ) : (
                        <>
                          {/* ◄ REPLACED STATIC MAPPING BLOCK WITH INDEPENDENT CHILD CARD */}
                          {paginatedReqs.map((req) => (
                            <DashboardRequirementCard 
                              key={req.id}
                              req={req}
                              isReqExpanded={expandedReqId === req.id}
                              onToggleExpand={() => setExpandedReqId(expandedReqId === req.id ? null : req.id)}
                              onUpdateSuccess={loadDashboardData} // Automatically fires background re-fetch to update summary widgets
                            />
                          ))}

                          {/* Pagination Control Node */}
                          {batchReqs.length > limit && (
                            <div className="pt-2 flex justify-center">
                              <button
                                onClick={() => handleShowMore(batch.id)}
                                className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
                              >
                                Show More ({batchReqs.length - limit} remaining)
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}