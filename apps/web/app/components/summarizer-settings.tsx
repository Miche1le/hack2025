import { useState } from 'react';

interface SummarizerSettingsProps {
  onSettingsChange?: (settings: SummarizerSettings) => void;
}

interface SummarizerSettings {
  useLocalOnly: boolean;
  maxLength: number;
  qualityThreshold: 'high' | 'medium' | 'low';
  localLLMUrl: string;
  ollamaModel: string;
}

export function SummarizerSettings({ onSettingsChange }: SummarizerSettingsProps) {
  const [settings, setSettings] = useState<SummarizerSettings>({
    useLocalOnly: false,
    maxLength: 420,
    qualityThreshold: 'medium',
    localLLMUrl: 'http://localhost:11434/api/generate',
    ollamaModel: 'mistral:7b-instruct'
  });

  const handleSettingChange = (key: keyof SummarizerSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">AI Summarizer Settings</h3>
      
      <div className="space-y-6">
        {/* Local LLM Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
          <div>
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Use Local LLM Only</label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Process summaries locally with Ollama (requires Docker setup)
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.useLocalOnly}
            onChange={(e) => handleSettingChange('useLocalOnly', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
          />
        </div>

        {/* Local LLM Configuration */}
        {settings.useLocalOnly && (
          <div className="space-y-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Local LLM Configuration</h4>
            
            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Ollama API URL
              </label>
              <input
                type="url"
                value={settings.localLLMUrl}
                onChange={(e) => handleSettingChange('localLLMUrl', e.target.value)}
                className="w-full rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="http://localhost:11434/api/generate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Model Name
              </label>
              <select
                value={settings.ollamaModel}
                onChange={(e) => handleSettingChange('ollamaModel', e.target.value)}
                className="w-full rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mistral:7b-instruct">Mistral 7B Instruct (Рекомендуется)</option>
                <option value="llama2:13b-chat">Llama 2 13B Chat (Лучшее качество)</option>
                <option value="codellama:13b-instruct">Code Llama 13B (Для кода)</option>
                <option value="mistral-nemo:12b">Mistral Nemo 12B (AI ускорение)</option>
                <option value="llama2:7b-chat">Llama 2 7B Chat (Быстро)</option>
                <option value="phi:2.7b">Phi 2.7B (Компактная)</option>
              </select>
            </div>
          </div>
        )}

        {/* Summary Length */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Max Summary Length
          </label>
          <input
            type="range"
            min="200"
            max="600"
            step="20"
            value={settings.maxLength}
            onChange={(e) => handleSettingChange('maxLength', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>200 chars</span>
            <span className="font-semibold">{settings.maxLength} chars</span>
            <span>600 chars</span>
          </div>
        </div>

        {/* Quality Threshold */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Quality Threshold
          </label>
          <select
            value={settings.qualityThreshold}
            onChange={(e) => handleSettingChange('qualityThreshold', e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low (Fast Processing)</option>
            <option value="medium">Medium (Balanced)</option>
            <option value="high">High (Best Quality)</option>
          </select>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Mode:
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            settings.useLocalOnly 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
          }`}>
            {settings.useLocalOnly ? 'Local LLM' : 'OpenAI API'}
          </span>
        </div>
      </div>
    </div>
  );
}
