import React, { useState, useEffect } from 'react';
import { EditorToolbar } from '@/components/ui/editor-toolbar';
import { ImageUpload } from '@/components/ui/image-upload';
import { CodeEditor } from '@/components/ui/code-editor';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { CodePreview } from '@/components/ui/code-preview';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import S3API from '@/lib/s3-api';
import { 
  Edit2, 
  Play, 
  Download, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  ArrowUp, 
  ArrowDown,
  X,
  History,
  Clock,
  User,
  AlertCircle,
  Eye,
  Wifi,
  WifiOff
} from 'lucide-react';

interface Screen {
  id: string;
  title: string;
  purpose: string[];
  elements: string[];
  action: string[];
  wireframes: string[];
  code?: string;
  codeLanguage?: string;
}

interface Rule {
  title: string;
  content: string;
}

interface VersionRecord {
  id: string;
  timestamp: number;
  changes: string[];
  author: string;
  description: string;
}

interface AppData {
  overview: {
    title: string;
    subtitle: string;
    description: string;
    purpose: string[];
    scope: string[];
    usage: string[];
  };
  screens: {
    fan: Screen[];
    creator: Screen[];
  };
  screensSectionTitle: string;
  screensSectionDescription: string;
  flowsTitle: string;
  flowsDescription: string;
  fanFlowTitle: string;
  creatorFlowTitle: string;
  rulesTitle: string;
  rulesDescription: string;
  rules: Rule[];
  versions: VersionRecord[];
}

const initialData: AppData = {
  overview: {
    title: "XROMEDA · 1:1 화상채팅",
    subtitle: "통합 인터랙티브 기획서 에디터 v1",
    description: "본 문서는 기존에 개발된 XROMEDA 1:1 화상채팅 리액트 프로토타입을 기반으로, 서비스의 통합 인터랙티브 기획서를 작성하는 것을 목표로 합니다. 팬과 크리에이터 모드의 전체 플로우를 포함하여, 화면별 와이어프레임, 동작 설명, 데이터 모델, 그리고 핵심적인 정책 및 비즈니스 룰을 하나의 문서로 상세히 정의합니다.",
    purpose: ["프로토타입의 직관적 경험을 정형화된 기획 문서로 전환하여, 향후 개발 및 운영의 기준을 확립합니다."],
    scope: ["팬 모드 (예약, 결제, 통화, 리뷰) 및 크리에이터 모드 (스케줄 관리, 요청 승인, 통화)의 전체 기능 명세."],
    usage: ["각 화면 항목의 설명을 참고하여 실제 프로토타입 화면을 캡처/붙여 넣어 완성할 수 있습니다."]
  },
  screensSectionTitle: "화면 정의 및 와이어프레임",
  screensSectionDescription: "이 섹션에서는 XROMEDA 애플리케이션의 모든 화면을 상세히 정의합니다.",
  flowsTitle: "유저 플로우",
  flowsDescription: "팬과 크리에이터의 주요 작업 흐름을 시각적으로 나타낸 다이어그램입니다.",
  fanFlowTitle: "팬 모드 유저 플로우",
  creatorFlowTitle: "크리에이터 모드 유저 플로우",
  rulesTitle: "기능 명세 및 정책 (비즈니스 룰)",
  rulesDescription: "XROMEDA 서비스의 핵심 운영 규칙과 기술적 명세를 정의합니다.",
  screens: {
    fan: [
      { 
        id: 'F-01', 
        title: '팬 홈 (메인)', 
        purpose: ['팬 모드의 핵심 기능을 제공하는 진입점입니다.'], 
        elements: ['프로필 영역', 'CTA 카드 2개: ① 1:1 화상채팅 예약하기 ② 화상 채팅 예약 현황'], 
        action: ['"예약하기" 카드 클릭 시 F-02로 전환됩니다. "예약 현황" 카드 클릭 시 F-07로 전환됩니다.'],
        wireframes: []
      },
      { 
        id: 'F-02', 
        title: '예약하기 — 세션 길이 선택', 
        purpose: ['팬이 원하는 세션 시간과 가격을 선택합니다.'], 
        elements: ['세션 길이/가격 버튼 그룹', '선택 상태 하이라이트'], 
        action: ['버튼 선택 시 해당 정보가 임시 저장되며, 길이 변경 시 시간 슬롯 선택이 초기화됩니다.'],
        wireframes: []
      },
      { 
        id: 'F-03', 
        title: '예약하기 — 달력', 
        purpose: ['팬이 예약 가능한 날짜를 확인하고 선택합니다.'], 
        elements: ['월 전환 UI', '날짜 셀 (예약 가능일/과거일 구분)'], 
        action: ['날짜 선택 시 해당 날짜의 예약 가능한 시간 슬롯 리스트가 하단에 노출됩니다.'],
        wireframes: []
      },
    ],
    creator: [
      { 
        id: 'C-01', 
        title: '크리에이터 대시보드', 
        purpose: ['크리에이터의 모든 관리 기능에 접근하는 허브입니다.'], 
        elements: ['탭 바: 예약 요청, 스케줄 캘린더, 내역, 설정'], 
        action: ['탭 클릭 시 각 기능 화면으로 전환됩니다.'],
        wireframes: []
      },
      { 
        id: 'C-02', 
        title: '예약 요청 리스트', 
        purpose: ['팬의 예약 요청을 확인하고 승인/거절합니다.'], 
        elements: ['대기 중 요청 카드', '"승인" / "거절" 버튼'], 
        action: ['"승인" 시 결제 확정 모달 노출, "거절" 시 사유 선택 드롭다운 노출.'],
        wireframes: []
      },
    ]
  },
  rules: [
    { title: '4.1. 슬롯 생성 규칙', content: '입력 데이터: 크리에이터의 `availableRanges` 및 `sessionPrices`를 기반으로 합니다. 버퍼 시간: 세션 간 최소 5분(설정 가능)의 버퍼를 둡니다.' },
    { title: '4.2. 중복/경합 처리', content: '승인 시점 확정형: 한 슬롯이 승인되면, 동일 시간대의 다른 모든 요청은 자동으로 거절 처리됩니다.' },
  ],
  versions: []
};

// Extend Window interface to include shared document
declare global {
  interface Window {
    __SHARED_DOCUMENT__?: {
      data: AppData;
      id: string;
      title: string;
      isPublished: boolean;
    };
    __SHARED_DOCUMENT_ERROR__?: string;
  }
}

export default function XromedaEditor() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [screenMode, setScreenMode] = useState<'fan' | 'creator'>('fan');
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [data, setData] = useState<AppData>(initialData);
  const [expandedRules, setExpandedRules] = useState<Set<number>>(new Set());
  const [previousData, setPreviousData] = useState<AppData>(initialData);
  
  // New state for S3-based sharing functionality
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isLoadingSharedDoc, setIsLoadingSharedDoc] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  
  // Editor states
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [previewCode, setPreviewCode] = useState<{code: string, language: string}>({code: '', language: 'javascript'});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Check server health and load document on mount
  useEffect(() => {
    const initializeApp = async () => {
      // Check if there's a shared document loaded by the script
      if (window.__SHARED_DOCUMENT__) {
        const sharedDoc = window.__SHARED_DOCUMENT__;
        setData(sharedDoc.data);
        setPreviousData(sharedDoc.data);
        setCurrentDocId(sharedDoc.id);
        setIsPublished(sharedDoc.isPublished);
        setShareUrl(S3API.generateShareUrl(sharedDoc.id));
        toast.success('공유된 문서를 S3에서 불러왔습니다! (manifest → release 방식)');
        return;
      }

      if (window.__SHARED_DOCUMENT_ERROR__) {
        toast.error(`공유 문서 로드 오류: ${window.__SHARED_DOCUMENT_ERROR__}`);
      }

      // Check if server is online
      const isServerOnline = await S3API.checkServerHealth();
      setServerOnline(isServerOnline);

      if (!isServerOnline) {
        toast.error('서버에 연결할 수 없습니다. 로컬 모드로 실행됩니다.');
        // Load from localStorage as fallback
        const savedData = localStorage.getItem('xromeda-editor-data');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            const migratedData = migrateData(parsedData);
            setData(migratedData);
            setPreviousData(migratedData);
          } catch (error) {
            console.error('Failed to load saved data:', error);
          }
        }
        return;
      }

      const sharedDocId = S3API.getDocIdFromUrl();
      if (sharedDocId && sharedDocId !== 'xromeda-main') {
        setIsLoadingSharedDoc(true);
        try {
          const sharedDoc = await S3API.getPublishedDocument(sharedDocId);
          if (sharedDoc) {
            setData(sharedDoc.data as AppData);
            setPreviousData(sharedDoc.data as AppData);
            setCurrentDocId(sharedDocId);
            setIsPublished(true);
            setShareUrl(S3API.generateShareUrl(sharedDocId));
            toast.success('공유된 문서를 S3에서 불러왔습니다! (API 방식)');
          } else {
            toast.error('공유된 문서를 찾을 수 없습니다.');
          }
        } catch (error) {
          toast.error('문서를 불러오는 중 오류가 발생했습니다.');
        } finally {
          setIsLoadingSharedDoc(false);
        }
      } else {
        // Load from localStorage as before
        const savedData = localStorage.getItem('xromeda-editor-data');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            const migratedData = migrateData(parsedData);
            setData(migratedData);
            setPreviousData(migratedData);
          } catch (error) {
            console.error('Failed to load saved data:', error);
          }
        }
      }
    };

    initializeApp();
  }, []);

  // Migration function to convert old data structure to new array-based structure
  const migrateData = (data: Record<string, unknown>): AppData => {
    const migrated = {
      ...initialData,
      ...data,
      overview: {
        ...initialData.overview,
        ...(data.overview as Record<string, unknown>),
        purpose: Array.isArray((data.overview as Record<string, unknown>)?.purpose) ? (data.overview as Record<string, unknown>).purpose : [(data.overview as Record<string, unknown>)?.purpose || initialData.overview.purpose[0]],
        scope: Array.isArray((data.overview as Record<string, unknown>)?.scope) ? (data.overview as Record<string, unknown>).scope : [(data.overview as Record<string, unknown>)?.scope || initialData.overview.scope[0]],
        usage: Array.isArray((data.overview as Record<string, unknown>)?.usage) ? (data.overview as Record<string, unknown>).usage : [(data.overview as Record<string, unknown>)?.usage || initialData.overview.usage[0]]
      },
      screens: {
        fan: (data.screens as Record<string, unknown>)?.fan ? ((data.screens as Record<string, unknown>).fan as Record<string, unknown>[]).map((screen: Record<string, unknown>) => ({
          ...screen,
          purpose: Array.isArray(screen.purpose) ? screen.purpose : [screen.purpose || '화면의 목적을 입력하세요.'],
          elements: Array.isArray(screen.elements) ? screen.elements : [screen.elements || '주요 요소를 입력하세요.'],
          action: Array.isArray(screen.action) ? screen.action : [screen.action || '화면의 동작을 설명하세요.'],
          wireframes: Array.isArray(screen.wireframes) ? screen.wireframes : (screen.wireframe ? [screen.wireframe] : [])
        })) : initialData.screens.fan,
        creator: (data.screens as Record<string, unknown>)?.creator ? ((data.screens as Record<string, unknown>).creator as Record<string, unknown>[]).map((screen: Record<string, unknown>) => ({
          ...screen,
          purpose: Array.isArray(screen.purpose) ? screen.purpose : [screen.purpose || '화면의 목적을 입력하세요.'],
          elements: Array.isArray(screen.elements) ? screen.elements : [screen.elements || '주요 요소를 입력하세요.'],
          action: Array.isArray(screen.action) ? screen.action : [screen.action || '화면의 동작을 설명하세요.'],
          wireframes: Array.isArray(screen.wireframes) ? screen.wireframes : (screen.wireframe ? [screen.wireframe] : [])
        })) : initialData.screens.creator
      },
      versions: (data.versions as VersionRecord[]) || []
    };
    return migrated;
  };

  // Auto-save functionality with version tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('xromeda-editor-data', JSON.stringify(data));
    }, 1000);
    return () => clearTimeout(timer);
  }, [data]);

  // Function to detect changes and create version record
  const detectChanges = (oldData: AppData, newData: AppData): string[] => {
    const changes: string[] = [];
    
    // Check overview changes
    if (oldData.overview.title !== newData.overview.title) changes.push(`제목 변경: "${oldData.overview.title}" → "${newData.overview.title}"`);
    if (oldData.overview.subtitle !== newData.overview.subtitle) changes.push(`부제목 변경: "${oldData.overview.subtitle}" → "${newData.overview.subtitle}"`);
    if (oldData.overview.description !== newData.overview.description) changes.push('개요 설명 수정');
    if (JSON.stringify(oldData.overview.purpose) !== JSON.stringify(newData.overview.purpose)) changes.push('목적 수정');
    if (JSON.stringify(oldData.overview.scope) !== JSON.stringify(newData.overview.scope)) changes.push('범위 수정');
    if (JSON.stringify(oldData.overview.usage) !== JSON.stringify(newData.overview.usage)) changes.push('문서 활용 수정');
    
    // Check screens changes
    ['fan', 'creator'].forEach(mode => {
      const oldScreens = oldData.screens[mode as keyof typeof oldData.screens];
      const newScreens = newData.screens[mode as keyof typeof newData.screens];
      
      if (oldScreens.length !== newScreens.length) {
        changes.push(`${mode === 'fan' ? '팬' : '크리에이터'} 모드 화면 개수 변경: ${oldScreens.length} → ${newScreens.length}`);
      }
      
      newScreens.forEach((newScreen, index) => {
        const oldScreen = oldScreens[index];
        if (oldScreen) {
          if (oldScreen.title !== newScreen.title) changes.push(`화면 ${newScreen.id} 제목 변경`);
          if (JSON.stringify(oldScreen.purpose) !== JSON.stringify(newScreen.purpose)) changes.push(`화면 ${newScreen.id} 목적 수정`);
          if (JSON.stringify(oldScreen.elements) !== JSON.stringify(newScreen.elements)) changes.push(`화면 ${newScreen.id} 요소 수정`);
          if (JSON.stringify(oldScreen.action) !== JSON.stringify(newScreen.action)) changes.push(`화면 ${newScreen.id} 동작 수정`);
          if (JSON.stringify(oldScreen.wireframes) !== JSON.stringify(newScreen.wireframes)) changes.push(`화면 ${newScreen.id} 와이어프레임 수정`);
          if (oldScreen.code !== newScreen.code) changes.push(`화면 ${newScreen.id} 코드 수정`);
        }
      });
    });
    
    // Check rules changes
    if (oldData.rules.length !== newData.rules.length) {
      changes.push(`규칙 개수 변경: ${oldData.rules.length} → ${newData.rules.length}`);
    }
    
    newData.rules.forEach((newRule, index) => {
      const oldRule = oldData.rules[index];
      if (oldRule) {
        if (oldRule.title !== newRule.title) changes.push(`규칙 ${index + 1} 제목 변경`);
        if (oldRule.content !== newRule.content) changes.push(`규칙 ${index + 1} 내용 수정`);
      }
    });
    
    return changes;
  };

  const createVersionRecord = (changes: string[]) => {
    if (changes.length === 0) return;
    
    const newVersion: VersionRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      changes,
      author: 'Editor User',
      description: changes.length > 3 ? `${changes.length}개 항목 수정` : changes.join(', ')
    };
    
    setData(prev => ({
      ...prev,
      versions: [newVersion, ...prev.versions.slice(0, 49)] // Keep only last 50 versions
    }));
  };

  const handleSave = async () => {
    const changes = detectChanges(previousData, data);
    createVersionRecord(changes);
    setPreviousData(data);
    localStorage.setItem('xromeda-editor-data', JSON.stringify(data));
    
    if (!serverOnline) {
      toast.success('데이터가 로컬에 저장되었습니다!');
      return;
    }

    // Save to S3 as draft
    try {
      let docId = currentDocId || 'xromeda-main';
      
      if (!currentDocId) {
        docId = await S3API.createDocument(data, data.overview.title);
        setCurrentDocId(docId);
      } else {
        await S3API.updateDocument(docId, data);
      }
      
      toast.success('데이터가 S3에 저장되었습니다!');
    } catch (error) {
      toast.error('S3 저장 중 오류가 발생했습니다. 로컬에만 저장되었습니다.');
    }
  };

  const handlePublish = async () => {
    if (!serverOnline) {
      toast.error('서버에 연결되지 않아 배포할 수 없습니다.');
      return;
    }

    try {
      let docId = currentDocId || 'xromeda-main';
      
      // First save as draft if not already saved
      if (!currentDocId) {
        docId = await S3API.createDocument(data, data.overview.title);
        setCurrentDocId(docId);
      } else {
        await S3API.updateDocument(docId, data);
      }
      
      // Then publish (Draft → Release)
      const success = await S3API.publishDocument(docId);
      
      if (success) {
        setIsPublished(true);
        const url = S3API.generateShareUrl(docId);
        setShareUrl(url);
        
        // Update URL without page reload
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('doc', docId);
        window.history.pushState({}, '', newUrl.toString());
        
        toast.success('문서가 S3에 성공적으로 배포되었습니다! (manifest → release 방식으로 공유됩니다)');
      } else {
        throw new Error('배포에 실패했습니다.');
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('배포 중 오류가 발생했습니다.');
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'xromeda-planning-document.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('데이터가 내보내기 되었습니다!');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          setData(importedData);
          toast.success('데이터가 가져오기 되었습니다!');
        } catch (error) {
          toast.error('파일을 읽는 중 오류가 발생했습니다.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTextEdit = (field: string, value: string, screenId?: string, ruleIndex?: number) => {
    if (ruleIndex !== undefined) {
      setData(prev => ({
        ...prev,
        rules: prev.rules.map((rule, index) =>
          index === ruleIndex ? { ...rule, [field]: value } : rule
        )
      }));
    } else if (screenId) {
      setData(prev => ({
        ...prev,
        screens: {
          ...prev.screens,
          [screenMode]: prev.screens[screenMode].map(screen =>
            screen.id === screenId ? { ...screen, [field]: value } : screen
          )
        }
      }));
    } else {
      // Handle top-level fields
      if (field.startsWith('overview.')) {
        const overviewField = field.replace('overview.', '');
        setData(prev => ({
          ...prev,
          overview: {
            ...prev.overview,
            [overviewField]: value
          }
        }));
      } else {
        setData(prev => ({
          ...prev,
          [field]: value
        }));
      }
    }
  };

  const handleArrayEdit = (field: string, index: number, value: string, screenId?: string) => {
    if (screenId) {
      setData(prev => ({
        ...prev,
        screens: {
          ...prev.screens,
          [screenMode]: prev.screens[screenMode].map(screen =>
            screen.id === screenId ? {
              ...screen,
              [field]: Array.isArray(screen[field as keyof Screen]) 
                ? (screen[field as keyof Screen] as string[]).map((item: string, i: number) =>
                    i === index ? value : item
                  )
                : [value]
            } : screen
          )
        }
      }));
    } else {
      // Handle overview arrays
      const overviewField = field.replace('overview.', '');
      setData(prev => ({
        ...prev,
        overview: {
          ...prev.overview,
          [overviewField]: Array.isArray(prev.overview[overviewField as keyof typeof prev.overview])
            ? (prev.overview[overviewField as keyof typeof prev.overview] as string[]).map((item: string, i: number) =>
                i === index ? value : item
              )
            : [value]
        }
      }));
    }
  };

  const addArrayItem = (field: string, screenId?: string) => {
    if (screenId) {
      setData(prev => ({
        ...prev,
        screens: {
          ...prev.screens,
          [screenMode]: prev.screens[screenMode].map(screen =>
            screen.id === screenId ? {
              ...screen,
              [field]: Array.isArray(screen[field as keyof Screen])
                ? [...(screen[field as keyof Screen] as string[]), '새 항목을 입력하세요.']
                : ['새 항목을 입력하세요.']
            } : screen
          )
        }
      }));
    } else {
      // Handle overview arrays
      const overviewField = field.replace('overview.', '');
      setData(prev => ({
        ...prev,
        overview: {
          ...prev.overview,
          [overviewField]: Array.isArray(prev.overview[overviewField as keyof typeof prev.overview])
            ? [...(prev.overview[overviewField as keyof typeof prev.overview] as string[]), '새 항목을 입력하세요.']
            : ['새 항목을 입력하세요.']
        }
      }));
    }
  };

  const removeArrayItem = (field: string, index: number, screenId?: string) => {
    if (screenId) {
      setData(prev => ({
        ...prev,
        screens: {
          ...prev.screens,
          [screenMode]: prev.screens[screenMode].map(screen =>
            screen.id === screenId ? {
              ...screen,
              [field]: Array.isArray(screen[field as keyof Screen])
                ? (screen[field as keyof Screen] as string[]).filter((_, i: number) => i !== index)
                : []
            } : screen
          )
        }
      }));
    } else {
      // Handle overview arrays
      const overviewField = field.replace('overview.', '');
      setData(prev => ({
        ...prev,
        overview: {
          ...prev.overview,
          [overviewField]: Array.isArray(prev.overview[overviewField as keyof typeof prev.overview])
            ? (prev.overview[overviewField as keyof typeof prev.overview] as string[]).filter((_, i: number) => i !== index)
            : []
        }
      }));
    }
  };

  const moveScreen = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= data.screens[screenMode].length) return;
    
    setData(prev => {
      const screens = [...prev.screens[screenMode]];
      const [movedScreen] = screens.splice(fromIndex, 1);
      screens.splice(toIndex, 0, movedScreen);
      
      return {
        ...prev,
        screens: {
          ...prev.screens,
          [screenMode]: screens
        }
      };
    });
    toast.success('화면 순서가 변경되었습니다!');
  };

  const addScreen = () => {
    const newId = screenMode === 'fan' ? `F-${String(data.screens.fan.length + 1).padStart(2, '0')}` : `C-${String(data.screens.creator.length + 1).padStart(2, '0')}`;
    const newScreen: Screen = {
      id: newId,
      title: '새 화면',
      purpose: ['화면의 목적을 입력하세요.'],
      elements: ['주요 요소를 입력하세요.'],
      action: ['화면의 동작을 설명하세요.'],
      wireframes: []
    };

    setData(prev => ({
      ...prev,
      screens: {
        ...prev.screens,
        [screenMode]: [...prev.screens[screenMode], newScreen]
      }
    }));
    toast.success('새 화면이 추가되었습니다!');
  };

  const deleteScreen = (screenId: string) => {
    setData(prev => ({
      ...prev,
      screens: {
        ...prev.screens,
        [screenMode]: prev.screens[screenMode].filter(screen => screen.id !== screenId)
      }
    }));
    if (selectedScreen === screenId) {
      setSelectedScreen(null);
    }
    toast.success('화면이 삭제되었습니다!');
  };

  const addRule = () => {
    const newRule: Rule = {
      title: '새 규칙',
      content: '규칙 내용을 입력하세요.'
    };
    const newIndex = data.rules.length;
    setData(prev => ({
      ...prev,
      rules: [...prev.rules, newRule]
    }));
    // Auto-expand the new rule
    setExpandedRules(prev => new Set([...prev, newIndex]));
    toast.success('새 규칙이 추가되었습니다!');
  };

  const deleteRule = (index: number) => {
    setData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
    // Remove from expanded set
    setExpandedRules(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      // Adjust indices for rules after the deleted one
      const adjustedSet = new Set();
      newSet.forEach(i => {
        if (i < index) {
          adjustedSet.add(i);
        } else if (i > index) {
          adjustedSet.add(i - 1);
        }
      });
      return adjustedSet;
    });
    toast.success('규칙이 삭제되었습니다!');
  };

  const toggleRuleExpansion = (index: number) => {
    setExpandedRules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleImageUpload = (imageUrl: string) => {
    if (editingScreenId) {
      setData(prev => ({
        ...prev,
        screens: {
          ...prev.screens,
          [screenMode]: prev.screens[screenMode].map(screen =>
            screen.id === editingScreenId ? { 
              ...screen, 
              wireframes: [...screen.wireframes, imageUrl]
            } : screen
          )
        }
      }));
    }
  };

  const removeWireframe = (screenId: string, wireframeIndex: number) => {
    setData(prev => ({
      ...prev,
      screens: {
        ...prev.screens,
        [screenMode]: prev.screens[screenMode].map(screen =>
          screen.id === screenId ? {
            ...screen,
            wireframes: screen.wireframes.filter((_, i) => i !== wireframeIndex)
          } : screen
        )
      }
    }));
  };

  const handleCodeSave = (code: string, language: string) => {
    if (editingScreenId) {
      setData(prev => ({
        ...prev,
        screens: {
          ...prev.screens,
          [screenMode]: prev.screens[screenMode].map(screen =>
            screen.id === editingScreenId ? { ...screen, code, codeLanguage: language } : screen
          )
        }
      }));
    }
  };

  const handleMarkdownSave = (markdown: string) => {
    if (editingRuleIndex !== null) {
      setData(prev => ({
        ...prev,
        rules: prev.rules.map((rule, index) =>
          index === editingRuleIndex ? { ...rule, content: markdown } : rule
        )
      }));
    }
  };

  const executeCode = (code: string) => {
    try {
      new Function(code)();
      toast.success('코드가 실행되었습니다!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      toast.error(`코드 실행 오류: ${errorMessage}`);
    }
  };

  const showCodePreviewModal = (code: string, language: string) => {
    setPreviewCode({ code, language });
    setShowCodePreview(true);
  };

  const EditableText: React.FC<{
    content: string;
    field: string;
    screenId?: string;
    ruleIndex?: number;
    arrayIndex?: number;
    className?: string;
    multiline?: boolean;
  }> = ({ content, field, screenId, ruleIndex, arrayIndex, className = '', multiline = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(content);

    // Update value when content changes
    useEffect(() => {
      setValue(content);
    }, [content]);

    const handleSave = () => {
      if (arrayIndex !== undefined) {
        handleArrayEdit(field, arrayIndex, value, screenId);
      } else {
        handleTextEdit(field, value, screenId, ruleIndex);
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (!multiline || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        setValue(content);
        setIsEditing(false);
      }
    };

    if (!isEditMode) {
      return <span className={className}>{content}</span>;
    }

    if (isEditing) {
      return multiline ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`${className} border border-blue-300 rounded px-2 py-1 min-h-20 w-full resize-none`}
          autoFocus
          placeholder="텍스트를 입력하세요..."
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`${className} border border-blue-300 rounded px-2 py-1 w-full`}
          autoFocus
          placeholder="텍스트를 입력하세요..."
        />
      );
    }

    return (
      <span
        className={`${className} ${isEditMode ? 'cursor-pointer hover:bg-blue-50 rounded px-1 inline-flex items-center' : ''}`}
        onClick={() => setIsEditing(true)}
      >
        {content}
        {isEditMode && <Edit2 className="inline w-3 h-3 ml-1 text-blue-500 flex-shrink-0" />}
      </span>
    );
  };

  const ArraySection: React.FC<{
    title: string;
    items: string[];
    field: string;
    screenId?: string;
    multiline?: boolean;
  }> = ({ title, items, field, screenId, multiline = false }) => {
    // Ensure items is always an array
    const safeItems = Array.isArray(items) ? items : [items || '새 항목을 입력하세요.'];
    
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-500 text-sm uppercase tracking-wider">{title}</h4>
          {isEditMode && (
            <Button
              onClick={() => addArrayItem(field, screenId)}
              size="sm"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-1" />
              추가
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {safeItems.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-gray-400 mt-1">•</span>
              <div className="flex-1">
                <EditableText 
                  content={item}
                  field={field}
                  screenId={screenId}
                  arrayIndex={index}
                  className="text-gray-800"
                  multiline={multiline}
                />
              </div>
              {isEditMode && safeItems.length > 1 && (
                <Button
                  onClick={() => removeArrayItem(field, index, screenId)}
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoadingSharedDoc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">S3에서 공유된 문서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EditorToolbar
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onSave={handleSave}
        onExport={handleExport}
        onImport={handleImport}
        onInsertImage={() => {
          setEditingField('wireframe');
          setShowImageUpload(true);
        }}
        onInsertCode={() => {
          setEditingField('code');
          setShowCodeEditor(true);
        }}
        onInsertMarkdown={() => {
          setEditingField('markdown');
          setShowMarkdownEditor(true);
        }}
        onPublish={handlePublish}
        isPublished={isPublished}
        shareUrl={shareUrl}
      />

      <div className="container mx-auto p-4 md:p-8">
        {/* Show server status */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {serverOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">S3 서버 연결됨 (manifest → release 방식)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-600">로컬 모드 (서버 연결 안됨)</span>
              </>
            )}
          </div>
        </div>

        {/* Show sharing status */}
        {isPublished && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-green-800 font-medium">문서가 S3에 배포되었습니다!</p>
                <p className="text-green-700 text-sm">다른 사용자들이 이 링크를 통해 최신 버전을 볼 수 있습니다 (manifest → release 방식): {shareUrl}</p>
              </div>
            </div>
          </div>
        )}

        <header className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              <EditableText content={data.overview.title} field="overview.title" className="text-3xl md:text-4xl font-bold text-gray-900" />
            </h1>
            <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="w-4 h-4 mr-2" />
                  버전 기록
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>버전 기록</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-4">
                    {data.versions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">아직 버전 기록이 없습니다.</p>
                    ) : (
                      data.versions.map((version) => (
                        <Card key={version.id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-500">{formatDate(version.timestamp)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-500">{version.author}</span>
                            </div>
                          </div>
                          <h4 className="font-medium mb-2">{version.description}</h4>
                          <div className="space-y-1">
                            {version.changes.map((change, index) => (
                              <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-gray-400 mt-1">•</span>
                                <span>{change}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-lg text-gray-600">
            <EditableText content={data.overview.subtitle} field="overview.subtitle" className="text-lg text-gray-600" />
          </p>
        </header>

        {/* Tab Navigation - Reordered */}
        <nav className="flex justify-center border-b border-gray-200 mb-8">
          {[
            { id: 'overview', label: '개요' },
            { id: 'rules', label: '정책 및 규칙' },
            { id: 'flows', label: '유저 플로우' },
            { id: 'screens', label: '화면 정의' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-lg font-semibold py-4 px-6 ${
                activeTab === tab.id
                  ? 'text-gray-900 border-b-2 border-violet-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <main>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold mb-4">문서 개요 및 목표</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                <EditableText 
                  content={data.overview.description} 
                  field="overview.description" 
                  className="text-gray-700 leading-relaxed"
                  multiline
                />
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-violet-50 p-6">
                  <h3 className="font-bold text-lg text-violet-800 mb-4">목적</h3>
                  <ArraySection
                    title=""
                    items={data.overview.purpose}
                    field="overview.purpose"
                    multiline
                  />
                </Card>
                
                <Card className="bg-violet-50 p-6">
                  <h3 className="font-bold text-lg text-violet-800 mb-4">범위</h3>
                  <ArraySection
                    title=""
                    items={data.overview.scope}
                    field="overview.scope"
                    multiline
                  />
                </Card>
                
                <Card className="bg-violet-50 p-6">
                  <h3 className="font-bold text-lg text-violet-800 mb-4">문서 활용</h3>
                  <ArraySection
                    title=""
                    items={data.overview.usage}
                    field="overview.usage"
                    multiline
                  />
                </Card>
              </div>
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">
                  <EditableText 
                    content={data.rulesTitle} 
                    field="rulesTitle" 
                    className="text-2xl font-bold"
                  />
                </h2>
                <p className="text-gray-600">
                  <EditableText 
                    content={data.rulesDescription} 
                    field="rulesDescription" 
                    className="text-gray-600"
                    multiline
                  />
                </p>
              </div>
              
              <div className="max-w-4xl mx-auto space-y-3">
                {data.rules.map((rule, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <EditableText 
                            content={rule.title} 
                            field="title"
                            ruleIndex={index}
                            className="font-semibold text-lg block w-full"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          {isEditMode && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteRule(index);
                              }}
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                          <button
                            onClick={() => toggleRuleExpansion(index)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {expandedRules.has(index) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {expandedRules.has(index) && (
                      <div className="p-4 text-gray-700">
                        <div className="prose max-w-none mb-4">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {rule.content}
                          </ReactMarkdown>
                        </div>
                        {isEditMode && (
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => {
                                setEditingRuleIndex(index);
                                setShowMarkdownEditor(true);
                              }}
                              size="sm"
                              variant="outline"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              내용 편집
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
                
                {isEditMode && (
                  <Button
                    onClick={addRule}
                    variant="outline"
                    className="w-full border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    규칙 추가
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* User Flows Tab */}
          {activeTab === 'flows' && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                <EditableText 
                  content={data.flowsTitle} 
                  field="flowsTitle" 
                  className="text-2xl font-bold"
                />
              </h2>
              <p className="text-gray-600 mb-8">
                <EditableText 
                  content={data.flowsDescription} 
                  field="flowsDescription" 
                  className="text-gray-600"
                  multiline
                />
              </p>
              
              <div className="space-y-12">
                <div>
                  <h3 className="text-xl font-bold mb-4">
                    <EditableText 
                      content={data.fanFlowTitle} 
                      field="fanFlowTitle" 
                      className="text-xl font-bold"
                    />
                  </h3>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {data.screens.fan.map((screen, index, array) => (
                      <React.Fragment key={screen.id}>
                        <div className="bg-white border border-gray-300 rounded-lg p-3 text-center min-w-32 max-w-48">
                          <div className="text-sm font-medium text-gray-800 break-words">
                            {screen.id} ({screen.title})
                          </div>
                        </div>
                        {index < array.length - 1 && (
                          <div className="text-2xl text-gray-400">→</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-4">
                    <EditableText 
                      content={data.creatorFlowTitle} 
                      field="creatorFlowTitle" 
                      className="text-xl font-bold"
                    />
                  </h3>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {data.screens.creator.map((screen, index, array) => (
                      <React.Fragment key={screen.id}>
                        <div className="bg-white border border-gray-300 rounded-lg p-3 text-center min-w-32 max-w-48">
                          <div className="text-sm font-medium text-gray-800 break-words">
                            {screen.id} ({screen.title})
                          </div>
                        </div>
                        {index < array.length - 1 && (
                          <div className="text-2xl text-gray-400">→</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Screens Tab */}
          {activeTab === 'screens' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">
                  <EditableText 
                    content={data.screensSectionTitle} 
                    field="screensSectionTitle" 
                    className="text-2xl font-bold"
                  />
                </h2>
                <p className="text-gray-600 mb-4">
                  <EditableText 
                    content={data.screensSectionDescription} 
                    field="screensSectionDescription" 
                    className="text-gray-600"
                    multiline
                  />
                </p>
                
                <div className="inline-flex bg-gray-200 rounded-lg p-1">
                  <Button
                    onClick={() => setScreenMode('fan')}
                    variant={screenMode === 'fan' ? 'default' : 'ghost'}
                    size="sm"
                  >
                    팬 모드 (F)
                  </Button>
                  <Button
                    onClick={() => setScreenMode('creator')}
                    variant={screenMode === 'creator' ? 'default' : 'ghost'}
                    size="sm"
                  >
                    크리에이터 모드 (C)
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-5 lg:col-span-4">
                  <div className="space-y-4">
                    {data.screens[screenMode].map((screen, index) => (
                      <Card
                        key={screen.id}
                        className={`p-4 cursor-pointer transition-all relative group ${
                          selectedScreen === screen.id
                            ? 'bg-violet-100 border-violet-400'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedScreen(screen.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg">
                              <EditableText 
                                content={screen.id} 
                                field="id" 
                                screenId={screen.id}
                                className="font-bold text-lg"
                              />
                            </h4>
                            <p className="text-gray-600">
                              <EditableText 
                                content={screen.title} 
                                field="title" 
                                screenId={screen.id}
                                className="text-gray-600"
                              />
                            </p>
                            {screen.wireframes.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                와이어프레임 {screen.wireframes.length}개
                              </p>
                            )}
                            {screen.code && (
                              <p className="text-xs text-blue-500 mt-1">
                                코드 포함됨
                              </p>
                            )}
                          </div>
                          {isEditMode && (
                            <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveScreen(index, index - 1);
                                }}
                                size="sm"
                                variant="ghost"
                                disabled={index === 0}
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveScreen(index, index + 1);
                                }}
                                size="sm"
                                variant="ghost"
                                disabled={index === data.screens[screenMode].length - 1}
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteScreen(screen.id);
                                }}
                                size="sm"
                                variant="ghost"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                    
                    {isEditMode && (
                      <Button
                        onClick={addScreen}
                        variant="outline"
                        className="w-full border-dashed"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        화면 추가
                      </Button>
                    )}
                  </div>
                </div>

                <div className="md:col-span-7 lg:col-span-8">
                  {selectedScreen ? (
                    <Card className="sticky top-24 p-6 min-h-[60vh]">
                      {(() => {
                        const screen = data.screens[screenMode].find(s => s.id === selectedScreen);
                        if (!screen) return null;

                        return (
                          <div>
                            <h3 className="text-2xl font-bold mb-4">
                              <EditableText 
                                content={screen.id} 
                                field="id" 
                                screenId={screen.id}
                                className="font-bold"
                              />
                              : <EditableText 
                                content={screen.title} 
                                field="title" 
                                screenId={screen.id}
                              />
                            </h3>
                            
                            <div className="space-y-5">
                              <ArraySection
                                title="목적"
                                items={screen.purpose}
                                field="purpose"
                                screenId={screen.id}
                                multiline
                              />

                              <ArraySection
                                title="주요 요소"
                                items={screen.elements}
                                field="elements"
                                screenId={screen.id}
                              />

                              <ArraySection
                                title="동작"
                                items={screen.action}
                                field="action"
                                screenId={screen.id}
                                multiline
                              />

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-gray-500 text-sm uppercase tracking-wider">와이어프레임</h4>
                                  {isEditMode && (
                                    <Button
                                      onClick={() => {
                                        setEditingScreenId(screen.id);
                                        setShowImageUpload(true);
                                      }}
                                      size="sm"
                                      variant="outline"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      이미지 추가
                                    </Button>
                                  )}
                                </div>
                                
                                {screen.wireframes.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {screen.wireframes.map((wireframe, index) => (
                                      <div key={index} className="relative group">
                                        <img
                                          src={wireframe}
                                          alt={`${screen.id} wireframe ${index + 1}`}
                                          className="w-full rounded-md border"
                                        />
                                        {isEditMode && (
                                          <Button
                                            onClick={() => removeWireframe(screen.id, index)}
                                            size="sm"
                                            variant="ghost"
                                            className="absolute top-2 right-2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <X className="w-4 h-4 text-red-500" />
                                          </Button>
                                        )}
                                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                          {index + 1} / {screen.wireframes.length}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                      <p>와이어프레임 이미지를 업로드하세요</p>
                                      {isEditMode && (
                                        <p className="text-sm mt-2">여러 개의 이미지를 추가할 수 있습니다</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {screen.code && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-gray-500 text-sm uppercase tracking-wider">실행 가능한 코드</h4>
                                    <div className="flex space-x-2">
                                      <Badge variant="secondary">{screen.codeLanguage}</Badge>
                                      <Button
                                        onClick={() => showCodePreviewModal(screen.code!, screen.codeLanguage || 'javascript')}
                                        size="sm"
                                        variant="outline"
                                      >
                                        <Eye className="w-4 h-4 mr-2" />
                                        미리보기
                                      </Button>
                                      {screen.codeLanguage === 'javascript' && (
                                        <Button
                                          onClick={() => executeCode(screen.code!)}
                                          size="sm"
                                          variant="outline"
                                        >
                                          <Play className="w-4 h-4 mr-2" />
                                          실행
                                        </Button>
                                      )}
                                      {isEditMode && (
                                        <Button
                                          onClick={() => {
                                            setEditingScreenId(screen.id);
                                            setShowCodeEditor(true);
                                          }}
                                          size="sm"
                                          variant="outline"
                                        >
                                          편집
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-64">
                                    <code>{screen.code}</code>
                                  </pre>
                                </div>
                              )}

                              {isEditMode && !screen.code && (
                                <div>
                                  <Button
                                    onClick={() => {
                                      setEditingScreenId(screen.id);
                                      setShowCodeEditor(true);
                                    }}
                                    variant="outline"
                                    className="w-full"
                                  >
                                    코드 추가
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </Card>
                  ) : (
                    <Card className="sticky top-24 p-6 min-h-[60vh] flex items-center justify-center">
                      <p className="text-center text-gray-500">왼쪽 목록에서 화면을 선택하세요.</p>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showImageUpload && (
        <ImageUpload
          onImageUpload={handleImageUpload}
          onClose={() => {
            setShowImageUpload(false);
            setEditingScreenId(null);
          }}
        />
      )}

      {showCodeEditor && (
        <CodeEditor
          onSave={handleCodeSave}
          onClose={() => {
            setShowCodeEditor(false);
            setEditingScreenId(null);
          }}
          initialCode={editingScreenId ? data.screens[screenMode].find(s => s.id === editingScreenId)?.code : undefined}
          initialLanguage={editingScreenId ? data.screens[screenMode].find(s => s.id === editingScreenId)?.codeLanguage : undefined}
        />
      )}

      {showMarkdownEditor && (
        <MarkdownEditor
          onSave={handleMarkdownSave}
          onClose={() => {
            setShowMarkdownEditor(false);
            setEditingRuleIndex(null);
          }}
          initialContent={editingRuleIndex !== null ? data.rules[editingRuleIndex].content : ''}
        />
      )}

      {showCodePreview && (
        <CodePreview
          code={previewCode.code}
          language={previewCode.language}
          onClose={() => setShowCodePreview(false)}
        />
      )}
    </div>
  );
}