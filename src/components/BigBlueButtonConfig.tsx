import React, { useState } from 'react';
import { Settings, Save, TestTube, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { BigBlueButtonConfig } from '../types';
import { BigBlueButtonAPI } from '../services/bigbluebutton';

interface BigBlueButtonConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: BigBlueButtonConfig) => void;
  currentConfig: BigBlueButtonConfig;
}

const BigBlueButtonConfigComponent: React.FC<BigBlueButtonConfigProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig
}) => {
  const [config, setConfig] = useState<BigBlueButtonConfig>(currentConfig);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setTestMessage('');

    try {
      const api = new BigBlueButtonAPI(config);
      
      // Test by attempting to get meeting info for a dummy meeting
      // This will verify the server URL and API secret are working
      const testMeetingId = 'test-connection-' + Date.now();
      
      // Create a test meeting first
      const createResponse = await api.createMeeting({
        meetingID: testMeetingId,
        name: 'Connection Test',
        moderatorPW: 'test123',
        attendeePW: 'test123'
      });
      
      if (createResponse.returncode === 'SUCCESS') {
        setTestResult('success');
        setTestMessage('Successfully connected to BigBlueButton server!');
      } else {
        setTestResult('error');
        setTestMessage('Failed to connect: Invalid response from server');
      }
    } catch (error) {
      setTestResult('error');
      setTestMessage(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const isFormValid = config.serverUrl.trim() !== '' && config.apiSecret.trim() !== '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-blue-500 mr-3" />
            <h2 className="text-xl font-semibold text-white">BigBlueButton Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg p-4">
            <h3 className="text-blue-300 font-medium mb-2">Setup Instructions</h3>
            <div className="text-blue-200 text-sm space-y-1">
              <p>1. Install BigBlueButton on your server or use a hosting service</p>
              <p>2. Get your server URL (typically: https://yourdomain.com/bigbluebutton)</p>
              <p>3. Get your API secret from: <code className="bg-blue-800 px-1 rounded">bbb-conf --secret</code></p>
              <p>4. For demo purposes, you can use the default demo server provided</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Server URL *
              </label>
              <input
                type="url"
                value={config.serverUrl}
                onChange={(e) => setConfig({ ...config, serverUrl: e.target.value })}
                placeholder="https://yourdomain.com/bigbluebutton"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                The full URL to your BigBlueButton API endpoint
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Secret *
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={config.apiSecret}
                  onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })}
                  placeholder="Your BigBlueButton API secret"
                  className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Your BigBlueButton server's API secret key
              </p>
            </div>
          </div>

          {/* Test Connection */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Test Connection</h3>
              <button
                onClick={handleTest}
                disabled={!isFormValid || testing}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <TestTube className="h-4 w-4" />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg flex items-start gap-3 ${
                testResult === 'success' 
                  ? 'bg-green-900 bg-opacity-50 border border-green-700' 
                  : 'bg-red-900 bg-opacity-50 border border-red-700'
              }`}>
                {testResult === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${testResult === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                    {testResult === 'success' ? 'Connection Successful' : 'Connection Failed'}
                  </p>
                  <p className={`text-sm ${testResult === 'success' ? 'text-green-200' : 'text-red-200'}`}>
                    {testMessage}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Default Demo Server Info */}
          <div className="bg-yellow-900 bg-opacity-50 border border-yellow-700 rounded-lg p-4">
            <h3 className="text-yellow-300 font-medium mb-2">Demo Server</h3>
            <p className="text-yellow-200 text-sm mb-2">
              For testing purposes, you can use these BigBlueButton demo servers:
            </p>
            <div className="bg-yellow-800 bg-opacity-50 p-2 rounded text-xs text-yellow-100 font-mono">
              <div>URL: https://test-install.blindsidenetworks.com/bigbluebutton</div>
              <div>Secret: 8cd8ef52e8e101574e400365b55e11a6</div>
              <div className="mt-2 pt-2 border-t border-yellow-700">
                Alternative: https://demo.bigbluebutton.org/bigbluebutton
              </div>
            </div>
            <p className="text-yellow-200 text-xs mt-2">
              ⚠️ Note: Demo server has limitations and should not be used for production
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default BigBlueButtonConfigComponent;