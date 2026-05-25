'use client';

import { useEffect, useState } from 'react';

type ApiConfig = {
  id: number;
  provider: string;
  isEnabled: boolean;
  apiKey?: string;
  modelName?: string;
  maxTokens: number;
  temperature: number;
  priority: number;
};

export default function ApiConfigPage() {
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchApiConfigs();
  }, []);

  const fetchApiConfigs = async () => {
    try {
      const response = await fetch('/api/admin/api-config');
      if (response.ok) {
        const data = await response.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error('Error fetching API configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (config: ApiConfig) => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/admin/api-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        setMessage('Configuration updated successfully!');
        fetchApiConfigs(); // Refresh the list
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('Error updating configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (id: number, field: keyof ApiConfig, value: any) => {
    setConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, [field]: value } : config
    ));
  };

  const handleSave = (config: ApiConfig) => {
    updateConfig(config);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API Configuration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage AI provider settings and API keys
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('Error') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* API Configurations */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            AI Provider Settings
          </h3>
          
          <div className="space-y-6">
            {configs.map((config) => (
              <div key={config.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900 capitalize">
                    {config.provider}
                  </h4>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.isEnabled}
                        onChange={(e) => handleConfigChange(config.id, 'isEnabled', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enabled</span>
                    </label>
                    <button
                      onClick={() => handleSave(config)}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={config.apiKey || ''}
                      onChange={(e) => handleConfigChange(config.id, 'apiKey', e.target.value)}
                      placeholder="Enter API key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={config.modelName || ''}
                      onChange={(e) => handleConfigChange(config.id, 'modelName', e.target.value)}
                      placeholder="e.g., perplexity/sonar"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={config.maxTokens}
                      onChange={(e) => handleConfigChange(config.id, 'maxTokens', parseInt(e.target.value))}
                      min="1"
                      max="8000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temperature
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={config.temperature}
                      onChange={(e) => handleConfigChange(config.id, 'temperature', parseFloat(e.target.value))}
                      min="0"
                      max="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority (1 = highest)
                    </label>
                    <input
                      type="number"
                      value={config.priority}
                      onChange={(e) => handleConfigChange(config.id, 'priority', parseInt(e.target.value))}
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Provider-specific help text */}
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    {config.provider === 'openrouter' && (
                      <>OpenRouter supports multiple AI models. Use model names like "perplexity/sonar" or "anthropic/claude-3-5-sonnet".</>
                    )}
                    {config.provider === 'gemini' && (
                      <>Google Gemini API. Use model names like "gemini-1.5-pro" or "gemini-1.5-flash".</>
                    )}
                    {config.provider === 'claude' && (
                      <>Anthropic Claude API. Use model names like "claude-3-5-sonnet-20241022" or "claude-3-haiku-20240307".</>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Configuration Help</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>API Key:</strong> Your API key for the respective provider. Keep this secure.</p>
          <p><strong>Model Name:</strong> The specific AI model to use for each provider.</p>
          <p><strong>Max Tokens:</strong> Maximum number of tokens in the response (1-8000).</p>
          <p><strong>Temperature:</strong> Controls randomness (0-2). Lower values are more deterministic.</p>
          <p><strong>Priority:</strong> Order of preference when multiple providers are enabled (1 = highest).</p>
          <p><strong>Enabled:</strong> Toggle to enable/disable each provider.</p>
        </div>
      </div>
    </div>
  );
}
