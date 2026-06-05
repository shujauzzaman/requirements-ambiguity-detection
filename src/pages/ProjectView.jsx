import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../components/ui/Navbar';
import Button from '../components/reusable/Button';
import AnalysisRunner from '../components/AnalysisRunner';
import { supabase } from '../auth/supabaseClient';

export default function ProjectView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // Project Info States
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // File Workflow States
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [workflowStep, setWorkflowStep] = useState('upload'); // 'upload' | 'map_column' | 'ready' | 'processing'
  
  // CSV Parsing States
  const [headers, setHeaders] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [rawRows, setRawRows] = useState([]);
  const [cleanedStories, setCleanedStories] = useState([]);

  // Fetch project details on mount
  useEffect(() => {
    async function fetchProjectDetails() {
      try {
        setLoading(true);
        const { data, error: supabaseError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (supabaseError) throw supabaseError;
        setProject(data);
      } catch (err) {
        setError(err.message || 'Failed to load project details.');
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  // Read CSV file headers and setup selection workflow
  const processCSVFile = (targetFile) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r\n|\n/);
      
      if (lines.length === 0 || !lines[0]) {
        alert("The uploaded CSV file appears to be empty.");
        return;
      }

      const headerRow = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const cleanHeaders = headerRow.map(h => h.replace(/^"|"$/g, '').trim());
      
      setHeaders(cleanHeaders);
      setRawRows(lines.slice(1));
      setFile(targetFile); 
      setWorkflowStep('map_column');
    };

    reader.readAsText(targetFile);
  };

  // Extract designated column and isolate requirements strings
  const handleExtractDescriptions = () => {
    if (!selectedColumn) return;

    const columnIndex = headers.indexOf(selectedColumn);
    if (columnIndex === -1) return;

    const isolatedStories = [];

    rawRows.forEach((row) => {
      if (!row.trim()) return;
      
      const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      let cellValue = columns[columnIndex];
      
      if (cellValue) {
        cellValue = cellValue.replace(/^"|"$/g, '').trim();
        if (cellValue) {
          isolatedStories.push({ story_text: cellValue });
        }
      }
    });

    setCleanedStories(isolatedStories);
    setWorkflowStep('ready');
  };

  // Drag and Drop Event Utilities
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        processCSVFile(droppedFile);
      } else {
        alert("Please upload a valid CSV file format.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processCSVFile(e.target.files[0]);
    }
  };

  const handleResetWorkflow = () => {
    setFile(null);
    setHeaders([]);
    setSelectedColumn('');
    setRawRows([]);
    setCleanedStories([]);
    setWorkflowStep('upload');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 animate-pulse font-medium">Loading workspace context...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 max-w-md text-center">
            <h3 className="font-semibold text-lg mb-1">Error Loading Workspace</h3>
            <p className="text-sm mb-4">{error || "Project workspace not found."}</p>
            <button onClick={() => navigate('/dashboard')} className="text-sm font-semibold underline text-red-800">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-6 flex flex-col">
        
        {/* Dynamic Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium border border-indigo-100">
                {project.domain}
              </span>
              {project.description && (
                <p className="text-sm text-gray-500 truncate max-w-xl">— {project.description}</p>
              )}
            </div>
          </div>

          {/* Header Action Button Panel */}
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              &larr; All Projects
            </Link>
            
            <Link
              to={`/project/${projectId}/dashboard`}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-lg border border-gray-300 transition shadow-xs flex items-center gap-2"
            >
              📋 View Project Dashboard
            </Link>
          </div>
        </div>

        {/* Dynamic Workspace Card */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col min-h-[450px]">
          
          {/* STEP 1: INITIAL FILE UPLOAD DROPZONE */}
          {workflowStep === 'upload' && (
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-12 transition-colors cursor-pointer ${
                isDragActive ? "border-indigo-500 bg-indigo-50/40" : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => document.getElementById('csv-file-input').click()}
            >
              <input 
                type="file" 
                id="csv-file-input" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center mb-4 shadow-sm text-gray-400 font-bold text-xs tracking-wider">
                .CSV
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">Upload your user stories backlog</h3>
              <p className="text-sm text-gray-500 text-center max-w-xs mb-4">
                Drag and drop your export spreadsheet here, or click to browse files.
              </p>
              <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded border border-gray-200">
                Supports standard CSV formats from Jira or DevOps
              </span>
            </div>
          )}

          {/* STEP 2: DYNAMIC COLUMN REMOVAL MAPPING SELECTION */}
          {workflowStep === 'map_column' && (
            <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto py-6">
              <div className="text-center mb-6">
                <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl inline-block font-mono font-bold mb-3 border border-indigo-100">
                  {headers.length} Columns Found
                </span>
                <h3 className="text-lg font-semibold text-gray-900">Map Description Column</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Select which column holds your core user stories or requirements text block. All other non-essential data will be isolated out.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="columnSelect" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Data Column <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="columnSelect"
                    value={selectedColumn}
                    onChange={(e) => setSelectedColumn(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow font-medium text-sm"
                  >
                    <option value="">-- Choose target headers --</option>
                    {headers.map((hdr, idx) => (
                      <option key={idx} value={hdr}>{hdr}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleResetWorkflow}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <Button
                    variant="solid"
                    disabled={!selectedColumn}
                    onClick={handleExtractDescriptions}
                    className="flex-1 py-2.5 text-sm"
                  >
                    Isolate & Parse
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REFINEMENT PREVIEW STATE CONTAINER */}
          {workflowStep === 'ready' && (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Parsed Workspace Backlog</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Isolated Column: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-700">{selectedColumn}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    {cleanedStories.length} requirements loaded
                  </span>
                  <button 
                    onClick={handleResetWorkflow}
                    className="text-xs text-red-600 hover:underline font-medium"
                  >
                    Reset file
                  </button>
                </div>
              </div>

              {/* Preview Box Capped at 5 Elements */}
              <div className="flex-1 overflow-y-auto max-h-[300px] border border-gray-200 rounded-lg bg-gray-50 p-4 space-y-2 font-mono text-xs text-gray-600">
                {cleanedStories.slice(0, 5).map((story, index) => (
                  <div key={index} className="p-2.5 bg-white rounded border border-gray-100 shadow-xs truncate">
                    <span className="text-indigo-500 font-bold mr-2">[{index + 1}]</span>
                    {story.story_text}
                  </div>
                ))}
                
                {/* Reassurance Banner for Large Datasets */}
                {cleanedStories.length > 5 && (
                  <div className="p-3 text-center text-xs text-gray-400 bg-gray-100/60 rounded border border-dashed border-gray-200 mt-2 font-sans italic">
                    Showing first 5 rows. Remaining user stories are fully processed in buffer memory.
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <Button 
                  variant="solid" 
                  className="px-6 py-2.5 text-sm"
                  onClick={() => setWorkflowStep('processing')}
                >
                  Analyze &rarr;
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: PROCESSING AND LOG ARCHIVAL FLOW */}
          {workflowStep === 'processing' && (
            <AnalysisRunner 
              projectId={projectId} 
              stories={cleanedStories}
              fileName={file?.name || 'Uploaded_Requirements.csv'} 
              onCancel={handleResetWorkflow}
              onComplete={() => navigate(`/project/${projectId}/dashboard`)}
            />
          )}

        </div>
      </main>
    </div>
  );
}