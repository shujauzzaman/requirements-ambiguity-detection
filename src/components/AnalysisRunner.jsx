import { useState, useEffect, useRef } from 'react';
import { supabase } from '../auth/supabaseClient';

// Set VITE_MODAL_API_URL in your .env file (see .env.example).
const API_URL = "https://muhammadtehzeebul--qwen-req-ambiguity-fastapi-app.modal.run";
const BATCH_SIZE = 10;
const POLL_INTERVAL_MS = 3000;

// Poll /status for a single call_id until it's done (or errors).
async function pollUntilDone(callId) {
  while (true) {
    const res = await fetch(`${API_URL}/status?call_id=${callId}`);
    if (!res.ok) throw new Error(`Status check failed with ${res.status}`);
    const data = await res.json();

    if (data.status === "done") return data.results;
    if (data.status === "error") throw new Error(data.error || "Generation failed");

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

export default function AnalysisRunner({ projectId, stories, fileName, onCancel, onComplete }) {
  const [currentBatchProgress, setCurrentBatchProgress] = useState(0);
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function processInBatches() {
      try {
        // 0. Fetch the project's actual domain — used for every story in this batch
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('domain')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        const projectDomain = projectData?.domain || 'general';

        // 1. Determine the next sequential batch number for this project
        const { data: existingBatches, error: fetchError } = await supabase
          .from('batches')
          .select('batch_number')
          .eq('project_id', projectId);

        if (fetchError) throw fetchError;
        const nextBatchNumber = (existingBatches?.length || 0) + 1;

        // 2. Create parent batch record
        const { data: newBatch, error: batchError } = await supabase
          .from('batches')
          .insert([
            {
              project_id: projectId,
              batch_number: nextBatchNumber,
              file_name: fileName || `Uploaded_Requirements_#${nextBatchNumber}`
            }
          ])
          .select()
          .single();

        if (batchError) throw batchError;
        const generatedBatchId = newBatch.id;

        // 3. Loop through stories in chunks — each chunk runs sequentially
        //    on a single warm GPU container (no parallel containers spun up)
        for (let i = 0; i < stories.length; i += BATCH_SIZE) {
          const batch = stories.slice(i, i + BATCH_SIZE);

          setCurrentBatchProgress(i);

          const submitRes = await fetch(`${API_URL}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requirements: batch.map((s) => ({
                text: s.story_text,
                domain: projectDomain,
                input_type: 'user_story',
              })),
            }),
          });

          if (!submitRes.ok) throw new Error(`Submit failed with status ${submitRes.status}`);
          const { call_id } = await submitRes.json();

          const aiResults = await pollUntilDone(call_id);

          const rowsToInsert = batch.map((story, index) => {
            const aiResponse = aiResults[index] || {};
            return {
              project_id: projectId,
              batch_id: generatedBatchId,
              story_text: story.story_text,
              is_ambiguous: aiResponse.is_ambiguous ?? true,
              ambiguity_types: aiResponse.ambiguity_types || [],
              flagged_spans: aiResponse.flagged_spans || [],
              clarification_questions: aiResponse.clarification_questions || [],
              generated_user_story: aiResponse.user_story || '',
              acceptance_criteria: aiResponse.acceptance_criteria || [],
              status: 'completed'
            };
          });

          const { error: dbError } = await supabase
            .from('requirements')
            .insert(rowsToInsert);

          if (dbError) throw dbError;
        }

        setStatus('completed');

      } catch (err) {
        console.error("Pipeline run failure:", err);
        setErrorMessage(`Execution interrupted: ${err.message}`);
        setStatus('error');
      }
    }

    if (stories.length > 0) {
      processInBatches();
    }
  }, [stories, projectId, fileName]);

  const processedCount = Math.min(currentBatchProgress + BATCH_SIZE, stories.length);
  const progressPercentage = Math.round((processedCount / stories.length) * 100);

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 max-w-md w-full mx-auto">
      {status === 'processing' && (
        <div className="w-full text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-950">Running Optimized Analysis Batch...</h3>
          <p className="text-sm text-gray-500 mt-1">Processed {processedCount} of {stories.length} requirements</p>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mt-6 border border-gray-200 overflow-hidden">
            <div className="bg-indigo-600 h-2.5 transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <span className="text-xs text-gray-400 mt-2 inline-block font-mono">{progressPercentage}% Uploaded</span>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center bg-red-50 p-6 rounded-xl border border-red-200">
          <p className="text-sm font-semibold text-red-800 mb-4">{errorMessage}</p>
          <button onClick={onCancel} className="text-xs bg-white text-red-700 px-4 py-2 border border-red-300 rounded-md font-medium shadow-xs hover:bg-gray-50 transition">
            Halt and Go Back
          </button>
        </div>
      )}

      {status === 'completed' && (
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-xl">✓</div>
          <h3 className="text-lg font-semibold text-gray-950">Bulk Analysis Complete!</h3>
          <p className="text-sm text-gray-500 mt-1">All entries processed through optimized pipeline layers.</p>
          <button onClick={onComplete} className="mt-6 w-full bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 transition">
            View Project Dashboard &rarr;
          </button>
        </div>
      )}
    </div>
  );
}