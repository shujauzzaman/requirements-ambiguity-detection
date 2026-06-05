import { useState } from 'react';
import { supabase } from '../auth/supabaseClient';

export default function DashboardRequirementCard({ req, isReqExpanded, onToggleExpand, onUpdateSuccess }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(req.improved_version || req.story_text);
  const [isSaving, setIsSaving] = useState(false);

  // Handle inline modification saves
  const handleSaveEdit = async (e) => {
    e.stopPropagation(); // Stop accordion from closing
    if (!editedText.trim()) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('requirements')
        .update({ 
          improved_version: editedText,
          status: 'completed' // Reset back to completed if they modified it without approving yet
        })
        .eq('id', req.id);

      if (error) throw error;
      setIsEditing(false);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      console.error("Failed to commit requirement modification:", err);
      alert("Could not update requirement.");
    } finally {
      setIsSaving(false);
    }
  };

  // Lock in final approval status
  const handleApprove = async (e) => {
    e.stopPropagation(); // Stop accordion from closing
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('requirements')
        .update({ 
          improved_version: editedText,
          status: 'approved' 
        })
        .eq('id', req.id);

      if (error) throw error;
      setIsEditing(false);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      console.error("Failed to approve version control block:", err);
      alert("Could not approve revision layout.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200/80 shadow-xs hover:border-gray-300 transition overflow-hidden">
      
      {/* Collapsible Row Trigger */}
      <div 
        onClick={onToggleExpand}
        className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
      >
        <p className="text-sm font-medium text-gray-800 flex-1 truncate">
          "{req.story_text}"
        </p>
        <div className="flex items-center gap-3 shrink-0">
          {/* Dynamic Workflow Lifecycle Badges */}
          {req.status === 'approved' ? (
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
              ✓ Approved
            </span>
          ) : (
            <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wide ${
              req.is_ambiguous 
                ? "bg-red-50 text-red-700 border border-red-100" 
                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
            }`}>
              {req.is_ambiguous ? 'Ambiguous' : 'Clear'}
            </span>
          )}
          <span className="text-[10px] text-gray-400 font-medium">
            {isReqExpanded ? 'Hide Details ▲' : 'Inspect Details ▼'}
          </span>
        </div>
      </div>

      {/* Deep-Dive Analysis Area */}
      {isReqExpanded && (
        <div className="px-4 pb-5 pt-3 border-t border-gray-100 bg-gray-50/30 space-y-4 text-xs">
          
          {/* 1. Flaw Analysis View Block */}
          <div>
            <h4 className="font-semibold text-red-800 uppercase tracking-wider text-[10px] mb-1">
              Flaw Analysis Report
            </h4>
            <p className="text-gray-700 leading-relaxed bg-white p-3 rounded-lg border border-gray-100">
              {req.explanation || "No explicit flaw flags detected by the adapter weights runtime model."}
            </p>
          </div>

          {/* 2. Stakeholder Clarification Matrix */}
          <div>
            <h4 className="font-semibold text-amber-800 uppercase tracking-wider text-[10px] mb-1">
              Targeted Clarification Prompts
            </h4>
            {req.clarification_questions && req.clarification_questions.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-gray-700 bg-white p-3 rounded-lg border border-gray-100">
                {req.clarification_questions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic bg-white p-3 rounded-lg border border-gray-100">No verification queries requested.</p>
            )}
          </div>

          {/* 3. REFINED USER STORY INTERACTIVE EDIT/APPROVE BLOCK */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-semibold text-emerald-800 uppercase tracking-wider text-[10px]">
                AmbiGuard Refined Structural Draft
              </h4>
              {req.status !== 'approved' && !isEditing && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                >
                  ✏️ Edit Refinement
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  disabled={isSaving}
                  rows={3}
                  className="w-full p-2 text-xs bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans resize-y text-gray-900"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditedText(req.improved_version || req.story_text);
                      setIsEditing(false);
                    }}
                    disabled={isSaving}
                    className="px-2.5 py-1 text-[11px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-2.5 py-1 text-[11px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-xs transition"
                  >
                    Save Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4 bg-emerald-50/30 border border-emerald-100 p-3 rounded-lg transition-all">
                <p className={`text-gray-800 font-medium italic leading-relaxed flex-1 ${req.status === 'approved' ? 'text-emerald-950 not-italic font-semibold' : ''}`}>
                  "{editedText || "Base structure verified completely objective. Optimization draft skipped."}"
                </p>
                {req.status !== 'approved' && (
                  <button
                    onClick={handleApprove}
                    disabled={isSaving}
                    className="shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] rounded shadow-xs transition cursor-pointer"
                  >
                    {isSaving ? "Locking..." : "Approve Version"}
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}