import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Play, Code, Eye, RefreshCw, AlertTriangle } from 'lucide-react';

interface CodePreviewProps {
  code: string;
  language: string;
  onClose: () => void;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ code, language, onClose }) => {
  const [output, setOutput] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const executeCode = async () => {
    setIsExecuting(true);
    setError(null);
    
    try {
      if (language === 'javascript') {
        // Capture console output
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        let capturedOutput = '';
        
        console.log = (...args) => {
          capturedOutput += args.join(' ') + '\n';
          originalConsoleLog(...args);
        };
        
        console.error = (...args) => {
          capturedOutput += 'ERROR: ' + args.join(' ') + '\n';
          originalConsoleError(...args);
        };

        // Execute the code
        const result = new Function(code)();
        
        // Restore console
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        
        if (result !== undefined) {
          capturedOutput += `\nReturn: ${JSON.stringify(result)}`;
        }
        
        setOutput(capturedOutput || 'Code executed successfully (no output)');
        
        // Try to generate HTML preview if code creates DOM elements
        generateHtmlPreview();
        
      } else if (language === 'html') {
        setPreviewHtml(code);
        setOutput('HTML rendered in preview');
        
      } else if (language === 'css') {
        const htmlWithCss = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>${code}</style>
          </head>
          <body>
            <div class="demo-container">
              <h1>CSS Demo</h1>
              <p>This is a paragraph to demonstrate CSS styles.</p>
              <button>Sample Button</button>
              <div class="box">Sample Box</div>
            </div>
          </body>
          </html>
        `;
        setPreviewHtml(htmlWithCss);
        setOutput('CSS applied to demo content');
        
      } else {
        setOutput(`Code preview is not available for ${language}`);
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setOutput(`Error: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const generateHtmlPreview = () => {
    // Try to create a simple HTML preview from JavaScript code
    if (code.includes('document.') || code.includes('createElement') || code.includes('innerHTML')) {
      const previewCode = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .preview-container { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="preview-container" id="preview-root">
            <h3>JavaScript Output Preview</h3>
            <div id="output"></div>
          </div>
          <script>
            try {
              ${code}
            } catch (error) {
              document.getElementById('output').innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
            }
          </script>
        </body>
        </html>
      `;
      setPreviewHtml(previewCode);
    }
  };

  const refreshPreview = () => {
    if (iframeRef.current) {
      // Force iframe refresh by updating srcDoc
      const currentSrcDoc = iframeRef.current.getAttribute('srcDoc');
      if (currentSrcDoc) {
        iframeRef.current.setAttribute('srcDoc', '');
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.setAttribute('srcDoc', currentSrcDoc);
          }
        }, 100);
      }
    }
  };

  useEffect(() => {
    // Auto-execute on mount if it's safe
    if (language === 'html' || language === 'css') {
      executeCode();
    }
  }, []);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            코드 실행 및 미리보기
            <Badge variant="secondary">{language}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-[70vh]">
          <div className="flex items-center gap-2 mb-4">
            <Button 
              onClick={executeCode} 
              disabled={isExecuting}
              size="sm"
            >
              {isExecuting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isExecuting ? '실행 중...' : '실행'}
            </Button>
            
            {previewHtml && (
              <Button onClick={refreshPreview} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                미리보기 새로고침
              </Button>
            )}
            
            {error && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                오류 발생
              </div>
            )}
          </div>

          <Tabs defaultValue="output" className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="code">코드</TabsTrigger>
              <TabsTrigger value="output">출력</TabsTrigger>
              <TabsTrigger value="preview" disabled={!previewHtml}>
                <Eye className="w-4 h-4 mr-2" />
                미리보기
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="code" className="flex-1">
              <div className="h-full border rounded-md">
                <pre className="p-4 text-sm overflow-auto h-full bg-gray-50">
                  <code>{code}</code>
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="output" className="flex-1">
              <div className="h-full border rounded-md">
                <pre className={`p-4 text-sm overflow-auto h-full ${error ? 'bg-red-50 text-red-800' : 'bg-white'}`}>
                  {output || '실행 버튼을 클릭하여 코드를 실행하세요.'}
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1">
              {previewHtml ? (
                <div className="h-full border rounded-md overflow-hidden">
                  <iframe
                    ref={iframeRef}
                    srcDoc={previewHtml}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                    title="Code Preview"
                  />
                </div>
              ) : (
                <div className="h-full border rounded-md flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>미리보기를 사용할 수 없습니다</p>
                    <p className="text-sm">HTML, CSS 또는 DOM 조작 JavaScript 코드에서 사용 가능합니다</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};