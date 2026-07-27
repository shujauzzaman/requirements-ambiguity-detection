import { useState } from 'react';
import { supabase } from '../auth/supabaseClient';

export default function RequirementRow({ requirement, onUpdateSuccess }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(
    requirement.improved_requirement || requirement.improved_version || requirement.story_text
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showAC, setShowAC] = useState(false);

  const handleSaveEdit = async () => {
    if (!editedText.trim()) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('requirements')
        .update({
          improved_requirement: editedText,
          status: 'completed'
        })
        .eq('id', requirement.id);

      if (error) throw error;

      setIsEditing(false);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      console.error("Failed to update requirement text:", err);
      alert("Could not save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('requirements')
        .update({
          improved_requirement: editedText,
          status: 'approved'
        })
        .eq('id', requirement.id);

      if (error) throw error;
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      console.error("Approval tracking failure:", err);
      alert("Could not approve requirement.");
    } finally {
      setIsSaving(false);
    }
  };

  // acceptance_criteria is stored as jsonb — comes back as a real JS array already
  const acceptanceCriteria = Array.isArray(requirement.acceptance_criteria)
    ? requirement.acceptance_criteria
    : [];

  return (
    <tr className="hover:bg-gray-50/70 border-b border-gray-100 transition-colors align-top">
      {/* Original Story Text Column */}
      <td className="px-6 py-4 text-sm text-gray-950 max-w-xs break-words font-sans">
        {requirement.story_text}
      </td>

      {/* Ambiguity Assessment Badges */}
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {requirement.is_ambiguous ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            Ambiguous
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            Clear
          </span>
        )}
      </td>

      {/* REFINED VERSION / INLINE EDIT COLUMN */}
      <td className="px-6 py-4 text-sm text-gray-900 w-full min-w-[320px]">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              disabled={isSaving}
              rows={3}
              className="w-full p-2.5 text-sm bg-white border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans shadow-inner resize-y"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setEditedText(requirement.improved_requirement || requirement.improved_version || requirement.story_text);
                  setIsEditing(false);
                }}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition"
              >
                {isSaving ? "Saving..." : "Save Change"}
              </button>
            </div>
          </div>
        ) : (
          <div className="group relative">
            <p className={`font-sans leading-relaxed ${requirement.status === 'approved' ? 'text-emerald-950 font-medium' : 'text-gray-700'}`}>
              {requirement.improved_requirement || requirement.improved_version || <span className="italic text-gray-400">No refinement needed</span>}
            </p>
            {requirement.status !== 'approved' && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium opacity-80 hover:opacity-100 flex items-center gap-1"
              >
                ✏️ Edit refinement
              </button>
            )}
          </div>
        )}
      </td>

      {/* ACCEPTANCE CRITERIA COLUMN */}
      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
        {acceptanceCriteria.length > 0 ? (
          <div>
            <button
              onClick={() => setShowAC(!showAC)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              {showAC ? '▾' : '▸'} {acceptanceCriteria.length} criteria
            </button>
            {showAC && (
              <ul className="mt-2 space-y-1.5 list-disc list-inside text-xs text-gray-600 font-sans">
                {acceptanceCriteria.map((ac, idx) => (
                  <li key={idx} className="leading-snug">{ac}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <span className="italic text-gray-400 text-xs">None generated</span>
        )}
      </td>

      {/* WORKFLOW STATUS & APPROVAL ACTION BUTTON */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {requirement.status === 'approved' ? (
          <div className="flex items-center justify-end gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg w-fit ml-auto shadow-2xs">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved</span>
            <span>✓</span>
          </div>
        ) : (
          <button
            onClick={handleApprove}
            disabled={isSaving || isEditing}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-md shadow-2xs text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-40 transition-all cursor-pointer"
          >
            Approve Version
          </button>
        )}
      </td>
    </tr>
  );
}