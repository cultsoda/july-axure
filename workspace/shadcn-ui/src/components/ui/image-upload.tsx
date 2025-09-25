import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload, Link, X } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  onClose: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, onClose }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setIsUploading(true);
    try {
      // Convert to base64 for local storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onImageUpload(base64);
        toast.success('이미지가 업로드되었습니다!');
        onClose();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  }, [onImageUpload, onClose]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false
  });

  const handleUrlSubmit = () => {
    if (!imageUrl.trim()) {
      toast.error('이미지 URL을 입력해주세요.');
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
      onImageUpload(imageUrl);
      toast.success('이미지가 추가되었습니다!');
      onClose();
    } catch {
      toast.error('올바른 URL을 입력해주세요.');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>이미지 업로드</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              파일 업로드
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              {isDragActive ? (
                <p className="text-blue-600">파일을 여기에 놓아주세요...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-1">
                    클릭하거나 파일을 드래그하여 업로드
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF 파일 (최대 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              또는 이미지 URL 입력
            </label>
            <div className="flex space-x-2">
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleUrlSubmit} size="sm">
                <Link className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button onClick={onClose} variant="outline">
              취소
            </Button>
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">업로드 중...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};