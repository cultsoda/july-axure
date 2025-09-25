import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Save, 
  Download, 
  Upload, 
  Edit3, 
  Image, 
  Code, 
  FileText,
  Share,
  Globe,
  Copy,
  CheckCircle
} from 'lucide-react';

interface EditorToolbarProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onInsertImage: () => void;
  onInsertCode: () => void;
  onInsertMarkdown: () => void;
  onPublish?: () => void;
  isPublished?: boolean;
  shareUrl?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  isEditMode,
  onToggleEditMode,
  onSave,
  onExport,
  onImport,
  onInsertImage,
  onInsertCode,
  onInsertMarkdown,
  onPublish,
  isPublished = false,
  shareUrl
}) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!onPublish) return;
    
    setIsPublishing(true);
    try {
      await onPublish();
      toast.success('문서가 성공적으로 배포되었습니다!');
    } catch (error) {
      toast.error('배포 중 오류가 발생했습니다.');
    } finally {
      setIsPublishing(false);
    }
  };

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('공유 링크가 클립보드에 복사되었습니다!');
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              onClick={onToggleEditMode}
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditMode ? '편집 중' : '편집 모드'}
            </Button>
            
            {isEditMode && (
              <>
                <Button onClick={onSave} size="sm" variant="outline">
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
                
                <div className="h-6 w-px bg-gray-300" />
                
                <Button onClick={onInsertImage} size="sm" variant="ghost">
                  <Image className="w-4 h-4 mr-2" />
                  이미지
                </Button>
                
                <Button onClick={onInsertCode} size="sm" variant="ghost">
                  <Code className="w-4 h-4 mr-2" />
                  코드
                </Button>
                
                <Button onClick={onInsertMarkdown} size="sm" variant="ghost">
                  <FileText className="w-4 h-4 mr-2" />
                  마크다운
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isPublished && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                배포됨
              </Badge>
            )}
            
            <Button onClick={onExport} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
            
            <div className="relative">
              <Input
                type="file"
                accept=".json"
                onChange={onImport}
                className="absolute inset-0 opacity-0 cursor-pointer"
                id="import-file"
              />
              <Button size="sm" variant="outline" asChild>
                <label htmlFor="import-file" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  가져오기
                </label>
              </Button>
            </div>

            {onPublish && (
              <Button 
                onClick={handlePublish} 
                size="sm" 
                variant="default"
                disabled={isPublishing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Globe className="w-4 h-4 mr-2" />
                {isPublishing ? '배포 중...' : '배포하기'}
              </Button>
            )}

            {shareUrl && (
              <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Share className="w-4 h-4 mr-2" />
                    공유
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>문서 공유</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        공유 링크
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          value={shareUrl}
                          readOnly
                          className="flex-1"
                        />
                        <Button onClick={copyShareUrl} size="sm">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      이 링크를 통해 다른 사람들이 최신 버전의 문서를 볼 수 있습니다.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};