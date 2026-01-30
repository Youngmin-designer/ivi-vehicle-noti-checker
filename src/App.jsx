import { useState, useEffect, useCallback } from 'react';
import NotificationTable from './components/NotificationTable';
import PreviewPopup from './components/PreviewPopup';
import { LEVEL_REQUIRED_FIELDS, LEVEL_STYLES, FONT_LIST } from './constants';
import { measureLines, onFontsReady } from './utils/measureLines';
import './App.css';

// 기본 피그마 스펙 상수
const BASE_SPECS = {
  popupWidth: 510,
  title: {
    fontSize: 28,
    fontWeight: 600,
    lineHeight: 32,
  },
  description: {
    fontSize: 24,
    fontWeight: 400,
    lineHeight: 32,
  },
  maxTotalLines: 4,
};

function App() {
  const initialNotification = {
    level: 'information',
    icon: '',
    includeImage: false,
    title: '',
    description: '',
    hasError: false,
  };

  const [notifications, setNotifications] = useState([initialNotification]);
  const [history, setHistory] = useState([[initialNotification]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isUndoRedo, setIsUndoRedo] = useState(false);

  // 레벨별 필수 항목 체크 함수
  const checkRequiredFields = useCallback((noti) => {
    const requiredFields = LEVEL_REQUIRED_FIELDS[noti.level] || {
      title: 'optional',
      description: 'optional',
    };

    let hasError = false;

    // Title 체크
    if (requiredFields.title === 'required') {
      // 필수인데 비어있으면 에러
      if (!noti.title || !noti.title.trim()) {
        hasError = true;
      }
    } else if (requiredFields.title === 'disabled') {
      // 비활성화인데 값이 있으면 에러
      if (noti.title && noti.title.trim()) {
        hasError = true;
      }
    }
    // optional인 경우는 체크하지 않음

    // Description 체크
    if (requiredFields.description === 'required') {
      // 필수인데 비어있으면 에러
      if (!noti.description || !noti.description.trim()) {
        hasError = true;
      }
    } else if (requiredFields.description === 'disabled') {
      // 비활성화인데 값이 있으면 에러
      if (noti.description && noti.description.trim()) {
        hasError = true;
      }
    }
    // optional인 경우는 체크하지 않음

    return hasError;
  }, []);

  // 문구수 초과 체크 함수
  const checkLineCount = useCallback(async (noti) => {
    return new Promise((resolve) => {
      onFontsReady(() => {
        requestAnimationFrame(() => {
          let hasError = false;

          // 각 폰트에 대해 체크
          FONT_LIST.forEach((font) => {
            const levelStyle = LEVEL_STYLES[noti.level] || LEVEL_STYLES.information;
            const isCritical = noti.level === 'critical';
            const criticalDescSpec = levelStyle.description || {};

            // 이미지 포함 시 텍스트 영역 너비 조정 (horizontal 레이아웃에서만)
            const isVertical = levelStyle.layout === 'vertical';
            const IMAGE_AREA_WIDTH = 120;
            const textAreaWidth = !isVertical && noti.includeImage 
              ? 270  // 510 - 24(좌패딩) - 48(아이콘) - 24(갭) - 24(갭) - 120(이미지) = 270
              : levelStyle.textAreaWidth;

            // 임시 DOM 요소 생성하여 줄 수 측정
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.visibility = 'hidden';
            tempContainer.style.width = `${textAreaWidth}px`;
            tempContainer.style.fontFamily = font.id;
            document.body.appendChild(tempContainer);

            let titleLines = 0;
            let descLines = 0;

            if (!isCritical && levelStyle.hasTitle && noti.title) {
              const titleEl = document.createElement('div');
              titleEl.style.fontSize = `${BASE_SPECS.title.fontSize}px`;
              titleEl.style.fontWeight = BASE_SPECS.title.fontWeight;
              titleEl.style.lineHeight = `${BASE_SPECS.title.lineHeight}px`;
              titleEl.style.whiteSpace = 'pre-wrap'; // 줄바꿈 유지
              titleEl.style.wordBreak = 'break-word'; // 단어 단위 줄바꿈
              titleEl.style.width = `${textAreaWidth}px`;
              const titleText = noti.title.replace(/\\n/g, '\n');
              titleEl.textContent = titleText;
              tempContainer.appendChild(titleEl);
              titleLines = measureLines(titleEl, BASE_SPECS.title.lineHeight);
            }

            if (noti.description) {
              const descEl = document.createElement('div');
              if (isCritical) {
                descEl.style.fontSize = `${criticalDescSpec.fontSize}px`;
                descEl.style.fontWeight = criticalDescSpec.fontWeight;
                descEl.style.lineHeight = criticalDescSpec.lineHeight === 'auto' ? 'normal' : `${criticalDescSpec.lineHeight}px`;
              } else {
                descEl.style.fontSize = `${BASE_SPECS.description.fontSize}px`;
                descEl.style.fontWeight = BASE_SPECS.description.fontWeight;
                descEl.style.lineHeight = `${BASE_SPECS.description.lineHeight}px`;
              }
              descEl.style.whiteSpace = 'pre-wrap'; // 줄바꿈 유지
              descEl.style.wordBreak = 'break-word'; // 단어 단위 줄바꿈
              descEl.style.width = `${textAreaWidth}px`;
              const descText = noti.description.replace(/\\n/g, '\n');
              descEl.textContent = descText;
              tempContainer.appendChild(descEl);
              descLines = measureLines(descEl, isCritical ? criticalDescSpec.lineHeight : BASE_SPECS.description.lineHeight);
            }

            const totalLines = titleLines + descLines;
            const maxLines = isCritical ? criticalDescSpec.maxLines : BASE_SPECS.maxTotalLines;

            if (totalLines > maxLines) {
              hasError = true;
            }

            document.body.removeChild(tempContainer);
          });

          resolve(hasError);
        });
      });
    });
  }, []);

  // Undo
  const handleUndo = useCallback(() => {
    setHistory(prevHistory => {
      if (historyIndex > 0) {
        setIsUndoRedo(true);
        const prevState = JSON.parse(JSON.stringify(prevHistory[historyIndex - 1]));
        setNotifications(prevState);
        setHistoryIndex(historyIndex - 1);
      }
      return prevHistory;
    });
  }, [historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    setHistory(prevHistory => {
      if (historyIndex < prevHistory.length - 1) {
        setIsUndoRedo(true);
        const nextState = JSON.parse(JSON.stringify(prevHistory[historyIndex + 1]));
        setNotifications(nextState);
        setHistoryIndex(historyIndex + 1);
      }
      return prevHistory;
    });
  }, [historyIndex]);

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isUndo = (isMac && e.metaKey && e.key === 'z' && !e.shiftKey) || 
                     (!isMac && e.ctrlKey && e.key === 'z' && !e.shiftKey);
      const isRedo = (isMac && e.metaKey && e.shiftKey && e.key === 'z') || 
                     (!isMac && e.ctrlKey && e.key === 'y');

      // 입력 필드에 포커스가 있으면 기본 동작 허용 (텍스트 입력 undo)
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT')) {
        // 입력 필드에서는 브라우저 기본 undo/redo 사용
        return;
      }

      if (isUndo) {
        e.preventDefault();
        handleUndo();
      } else if (isRedo) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // 노티 업데이트 핸들러
  const handleUpdate = async (updatedNotifications) => {
    // 에러 체크 (필수 항목 + 문구수 초과)
    const updated = await Promise.all(
      updatedNotifications.map(async (noti) => {
        const hasRequiredError = checkRequiredFields(noti);
        const hasLineError = await checkLineCount(noti);
        return { ...noti, hasError: hasRequiredError || hasLineError };
      })
    );
    
    setNotifications(updated);
    // 히스토리 저장 (비동기 작업 완료 후)
    if (!isUndoRedo) {
      setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(updated))); // 깊은 복사
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    } else {
      setIsUndoRedo(false);
    }
  };

  // 새 행 추가
  const handleAddRow = () => {
    const newNotifications = [
      ...notifications,
      {
        level: 'information',
        icon: '',
        includeImage: false,
        title: '',
        description: '',
        hasError: false,
      },
    ];
    setNotifications(newNotifications);
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newNotifications))); // 깊은 복사
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  };

  // 모두 삭제
  const handleDeleteAll = () => {
    if (window.confirm('모든 행을 삭제하시겠습니까?')) {
      const newNotifications = [{
        level: 'information',
        icon: '',
        includeImage: false,
        title: '',
        description: '',
        hasError: false,
      }];
      setNotifications(newNotifications);
      setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(newNotifications))); // 깊은 복사
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Vehicle notification 문구 검수</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-add-row" onClick={handleAddRow}>
            + 행 추가
          </button>
          <button className="btn-delete-all" onClick={handleDeleteAll}>
            모두 삭제
          </button>
        </div>
      </header>

      <main className="app-main">
        <NotificationTable
          notifications={notifications}
          onUpdate={handleUpdate}
          onDelete={handleUpdate}
        />
      </main>
    </div>
  );
}

export default App;
