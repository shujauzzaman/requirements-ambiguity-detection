import { useState, useEffect } from 'react';
import Button from './reusable/Button';
import { useAuth } from '../auth/AuthContext';
import {
  testJiraConnection,
  saveJiraConnection,
  deleteJiraConnection,
} from '../services/jira-service';

export default function JiraConnectionPanel({ projectId, connection, onClose, onSaved }) {
  const { user } = useAuth();

  const [siteUrl, setSiteUrl] = useState(connection?.site_url || '');
  const [email, setEmail] = useState(connection?.email || '');
  const [apiToken, setApiToken] = useState(''); // never pre-filled — write-only field
  const [projectKey, setProjectKey] = useState(connection?.jira_project_key || '');
  const [issueType, setIssueType] = useState(connection?.issue_type || 'Story');

  const [testState, setTestState] = useState('idle'); // 'idle' | 'testing' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Re-validate if the user edits credentials after a successful test
  useEffect(() => {
    if (testState !== 'idle') setTestState('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteUrl, email, apiToken]);

  const handleTest = async () => {
    if (!siteUrl.trim() || !email.trim() || !apiToken.trim()) {
      setTestState('error');
      setTestMessage('Site URL, email, and API token are all required.');
      return;
    }

    setTestState('testing');
    setTestMessage('');

    try {
      const result = await testJiraConnection({
        site_url: siteUrl.trim(),
        email: email.trim(),
        api_token: apiToken.trim(),
      });

      if (result.success) {
        setTestState('success');
        setTestMessage(`Connected as ${result.display_name}.`);
      } else {
        setTestState('error');
        setTestMessage(result.error || 'Connection failed.');
      }
    } catch (err) {
      setTestState('error');
      setTestMessage(err.message || 'Connection failed.');
    }
  };

  const handleSave = async () => {
    if (testState !== 'success') {
      setSaveError('Please test the connection successfully before saving.');
      return;
    }
    if (!projectKey.trim()) {
      setSaveError('Jira project key is required (e.g. "PROJ").');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      const saved = await saveJiraConnection(projectId, user.id, {
        site_url: siteUrl.trim(),
        email: email.trim(),
        api_token: apiToken.trim(),
        jira_project_key: projectKey.trim().toUpperCase(),
        issue_type: issueType,
      });
      onSaved(saved);
    } catch (err) {
      setSaveError(err.message || 'Failed to save Jira connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Jira from this project? Already-pushed issues stay in Jira.')) {
      return;
    }
    setSaving(true);
    try {
      await deleteJiraConnection(projectId);
      onSaved(null);
    } catch (err) {
      setSaveError(err.message || 'Failed to disconnect.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {connection ? 'Jira Connection' : 'Connect Jira'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Approved requirements can be pushed to this Jira project as issues.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Jira Site URL</label>
            <input
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://yourcompany.atlassian.net"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              API Token{' '}
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 font-normal hover:underline text-xs"
              >
                (create one)
              </a>
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder={connection ? 'Enter a new token to replace the saved one' : '••••••••••••'}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Key</label>
              <input
                type="text"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value)}
                placeholder="PROJ"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Issue Type</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Story">Story</option>
                <option value="Task">Task</option>
                <option value="Bug">Bug</option>
              </select>
            </div>
          </div>

          {/* Test connection feedback */}
          <div>
            <button
              type="button"
              onClick={handleTest}
              disabled={testState === 'testing'}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            >
              {testState === 'testing' ? 'Testing connection...' : 'Test connection'}
            </button>
            {testState === 'success' && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mt-2">
                ✓ {testMessage}
              </p>
            )}
            {testState === 'error' && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
                {testMessage}
              </p>
            )}
          </div>

          {saveError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {saveError}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100">
          {connection ? (
            <button
              onClick={handleDisconnect}
              disabled={saving}
              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Disconnect
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Cancel
            </button>
            <Button variant="solid" size="md" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save connection'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}