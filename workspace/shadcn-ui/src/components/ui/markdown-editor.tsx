import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Save, Eye, Edit } from 'lucide-react';

interface MarkdownEditorProps {
  onSave: (markdown: string) => void;
  onClose: () => void;
  initialContent?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  onSave,
  onClose,
  initialContent = ''
}) => {
  const [content, setContent] = useState(initialContent);

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>마크다운 편집기</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="edit" className="h-[60vh]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">
              <Edit className="w-4 h-4 mr-2" />
              편집
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              미리보기
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit" className="h-full">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-4 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="마크다운 문법을 사용하여 내용을 작성하세요...

예시:
# 제목 1
## 제목 2
### 제목 3

**굵은 글씨**
*기울임 글씨*

- 목록 항목 1
- 목록 항목 2

1. 번호 목록 1
2. 번호 목록 2

[링크](https://example.com)

```javascript
// 코드 블록
console.log('Hello World');
```

> 인용문

| 표 | 헤더 |
|-----|------|
| 내용 | 내용 |"
            />
          </TabsContent>
          
          <TabsContent value="preview" className="h-full">
            <div className="h-full p-4 border border-gray-300 rounded-md overflow-auto bg-white">
              <div className="prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || '*미리보기할 내용이 없습니다.*'}
                </ReactMarkdown>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button onClick={onClose} variant="outline">
            취소
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};