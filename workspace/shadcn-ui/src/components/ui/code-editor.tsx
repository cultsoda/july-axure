import React, { useState } from 'react';
import { Button } from './button';
import { Play, X, Copy, Check } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  onSave: (code: string, language: string) => void;
  onClose: () => void;
  initialCode?: string;
  initialLanguage?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  onSave,
  onClose,
  initialCode = '',
  initialLanguage = 'javascript'
}) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' }
  ];

  const handleRunCode = () => {
    if (language === 'javascript') {
      try {
        // Create a safe execution context
        const originalConsoleLog = console.log;
        let capturedOutput = '';
        
        console.log = (...args) => {
          capturedOutput += args.join(' ') + '\n';
        };

        // Execute the code
        const result = new Function(code)();
        
        console.log = originalConsoleLog;
        
        if (result !== undefined) {
          capturedOutput += `Return: ${result}`;
        }
        
        setOutput(capturedOutput || 'Code executed successfully');
      } catch (error) {
        setOutput(`Error: ${error.message}`);
      }
    } else {
      setOutput('Code execution is only available for JavaScript');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleSave = () => {
    onSave(code, language);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 mx-4 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">코드 에디터</h3>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleCopy} variant="outline" size="sm">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            {language === 'javascript' && (
              <Button onClick={handleRunCode} variant="outline" size="sm">
                <Play className="w-4 h-4 mr-2" />
                실행
              </Button>
            )}
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          <div className="flex-1 border-r">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
          
          {output && (
            <div className="w-1/3 p-4 bg-gray-50">
              <h4 className="font-semibold mb-2">출력:</h4>
              <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-full">
                {output}
              </pre>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end space-x-2">
          <Button onClick={onClose} variant="outline">
            취소
          </Button>
          <Button onClick={handleSave}>
            저장
          </Button>
        </div>
      </div>
    </div>
  );
};