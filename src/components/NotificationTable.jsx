import { useState, useRef, useEffect, useCallback } from 'react';
import { LEVEL_LIST, ICON_LIST, LEVEL_REQUIRED_FIELDS } from '../constants';
import IconDropdown from './IconDropdown';
import PreviewPopup from './PreviewPopup';

// Title Case 변환 함수 (영문만)
const toTitleCase = (str) => {
  if (!str) return '';
  // 한글이 포함되어 있으면 변환하지 않음
  if (/[가-힣]/.test(str)) return str;
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function NotificationTable({ notifications, onUpdate, onDelete }) {
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [previewRowIndex, setPreviewRowIndex] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set()); // row 단위 선택
  const [isSelecting, setIsSelecting] = useState(false);
  const [activeRow, setActiveRow] = useState(null); // rowIndex만 추적
  const [editingRow, setEditingRow] = useState(null); // 현재 편집 중인 row
  const [openLevelDropdown, setOpenLevelDropdown] = useState(null); // 열린 레벨 드롭다운의 rowIndex
  const tableRef = useRef(null);
  const selectionStartRef = useRef(null);
  const levelDropdownRefs = useRef({}); // 각 row의 드롭다운 ref

  // 필터링된 노티 목록
  const filteredNotifications = showOnlyErrors
    ? notifications.filter(noti => noti.hasError)
    : notifications;

  // 레벨 뱃지 스타일
  const getLevelBadgeStyle = (level) => {
    const styles = {
      information: { bg: '#e3f2fd', color: '#1565c0' },
      warning: { bg: '#fff3e0', color: '#ef6c00' },
      urgent: { bg: '#fce4ec', color: '#c62828' },
      critical: { bg: '#b71c1c', color: '#ffffff' },
    };
    return styles[level] || styles.information;
  };

  // 레벨 뱃지 텍스트
  const getLevelBadgeText = (level) => {
    const texts = {
      information: 'INFO',
      warning: 'WARN',
      urgent: 'URGN',
      critical: 'CRIT',
    };
    return texts[level] || 'INFO';
  };

  // 레벨 뱃지 정보 (ivi-noti-checker와 동일)
  const levelBadgeInfo = {
    information: { abbr: 'INFO', bgColor: '#e3f2fd', textColor: '#1565c0' },
    warning: { abbr: 'WARN', bgColor: '#fff3e0', textColor: '#ef6c00' },
    urgent: { abbr: 'URGN', bgColor: '#fce4ec', textColor: '#c62828' },
    critical: { abbr: 'CRIT', bgColor: '#b71c1c', textColor: '#ffffff' },
  };

  // 아이콘 이름 정규화
  const normalizeIconName = (iconName) => {
    if (!iconName) return '';
    const normalized = iconName.toLowerCase().trim();
    // ICON_LIST에서 찾기
    const found = ICON_LIST.find(icon => 
      icon.toLowerCase() === normalized || 
      icon.toLowerCase() === `${normalized}.svg` ||
      icon.toLowerCase().replace('.svg', '') === normalized
    );
    if (found) {
      return found;
    }
    // 찾지 못하면 .svg 확장자 추가
    if (!normalized.endsWith('.svg')) {
      return `${normalized}.svg`;
    }
    return normalized;
  };

  // 행 업데이트
  const handleRowUpdate = (index, field, value) => {
    const actualIndex = showOnlyErrors 
      ? notifications.findIndex((_, i) => filteredNotifications[index] === notifications[i])
      : index;
    
    const updated = [...notifications];
    if (field === 'title') {
      // 영문인 경우 Title Case로 변환
      updated[actualIndex] = {
        ...updated[actualIndex],
        title: toTitleCase(value),
      };
    } else if (field === 'icon') {
      updated[actualIndex] = {
        ...updated[actualIndex],
        icon: normalizeIconName(value),
      };
    } else {
      updated[actualIndex] = {
        ...updated[actualIndex],
        [field]: value,
      };
    }
    onUpdate(updated);
  };

  // 행 삭제
  const handleDelete = (index) => {
    const actualIndex = showOnlyErrors 
      ? notifications.findIndex((_, i) => filteredNotifications[index] === notifications[i])
      : index;
    
    // 행이 하나일 때는 삭제하지 않고 초기화
    if (notifications.length === 1) {
      const resetNotification = {
        level: 'information',
        icon: '',
        includeImage: false,
        title: '',
        description: '',
        hasError: false,
      };
      onUpdate([resetNotification]);
    } else {
      const updated = notifications.filter((_, i) => i !== actualIndex);
      onUpdate(updated);
    }
  };

  // 에러 이유 계산
  const getErrorReasons = (noti) => {
    const reasons = [];
    const requiredFields = LEVEL_REQUIRED_FIELDS[noti.level] || {
      title: 'optional',
      description: 'optional',
    };

    if (requiredFields.title === 'required' && (!noti.title || !noti.title.trim())) {
      reasons.push('Title이 필수입니다');
    } else if (requiredFields.title === 'disabled' && noti.title && noti.title.trim()) {
      reasons.push('Title은 비어있어야 합니다');
    }

    if (requiredFields.description === 'required' && (!noti.description || !noti.description.trim())) {
      reasons.push('Description이 필수입니다');
    } else if (requiredFields.description === 'disabled' && noti.description && noti.description.trim()) {
      reasons.push('Description은 비어있어야 합니다');
    }

    return reasons;
  };

  // 미리보기 열기
  const handlePreview = (rowIndex) => {
    const actualIndex = showOnlyErrors 
      ? notifications.findIndex((_, i) => filteredNotifications[rowIndex] === notifications[i])
      : rowIndex;
    
    const noti = notifications[actualIndex];
    setPreviewData({
      icon: noti.icon,
      level: noti.level,
      includeImage: noti.includeImage || false,
      title: noti.title,
      description: noti.description,
      errorReasons: getErrorReasons(noti),
    });
    setPreviewRowIndex(actualIndex);
  };

  // 미리보기 닫기
  const handleClosePreview = () => {
    setPreviewData(null);
    setPreviewRowIndex(null);
  };

  // 행이 비어있는지 확인
  const isRowEmpty = (noti) => {
    return !noti.icon && !noti.title && !noti.description;
  };

  // 붙여넣기 처리 (row 단위)
  const handlePaste = useCallback((e, startRowIndex = null) => {
    const pasteData = e.clipboardData.getData('text');
    
    // 탭이 없으면 기본 동작 허용
    if (!pasteData.includes('\t')) {
      return;
    }
    
    e.preventDefault();
    
    // 활성 row가 있으면 그것을 사용, 없으면 전달된 파라미터 사용
    const targetRow = startRowIndex !== null ? startRowIndex : (activeRow !== null ? activeRow : null);
    
    if (targetRow === null) return;
    
    // 빈 행도 포함 (구글시트처럼)
    const rows = pasteData.split('\n');
    // 마지막 빈 행 제거 (구글시트에서 마지막 줄바꿈으로 인한)
    if (rows.length > 0 && rows[rows.length - 1].trim() === '') {
      rows.pop();
    }
    
    if (rows.length === 0) return;

    const updated = [...notifications];
    
    // 텍스트 처리 함수 (\\n을 실제 줄바꿈으로 변환)
    const processText = (text) => {
      if (text === undefined || text === null) return '';
      return text.replace(/\\n/g, '\n');
    };
    
    // 붙여넣을 데이터 파싱 (빈 셀도 유지)
    const pasteRows = rows.map(row => {
      const cells = row.split('\t');
      return cells.map(cell => processText(cell));
    });
    
    const pasteRowCount = pasteRows.length;
    const pasteColCount = Math.max(...pasteRows.map(row => row.length), 1);
    
    // 필요한 행 추가
    const neededRows = targetRow + pasteRowCount - updated.length;
    for (let i = 0; i < neededRows; i++) {
      updated.push({
        level: 'information',
        icon: '',
        includeImage: false,
        title: '',
        description: '',
        hasError: false,
      });
    }
    
    // 구글시트처럼 nxn으로 붙여넣기 (row 단위)
    pasteRows.forEach((row, rowIdx) => {
      const targetRowIndex = targetRow + rowIdx;
      if (targetRowIndex >= updated.length) return;
      
      // 첫 번째 컬럼은 title, 두 번째 컬럼은 description
      if (row[0] !== undefined) {
        updated[targetRowIndex] = {
          ...updated[targetRowIndex],
          title: row[0] ? toTitleCase(row[0]) : '',
        };
      }
      if (row[1] !== undefined) {
        // 두 번째 컬럼이 있으면 description에, 없으면 빈 값
        updated[targetRowIndex] = {
          ...updated[targetRowIndex],
          description: row[1] || '',
        };
      }
    });
    
    onUpdate(updated);
  }, [activeRow, notifications, onUpdate]);


  // Title/Description 셀 선택 시작
  const handleCellMouseDown = (rowIndex, e) => {
    if (e.button !== 0) return; // 왼쪽 클릭만
    
    // 입력 필드 클릭은 기본 동작 허용 (포커스 및 선택)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      // 다른 row의 textarea를 클릭한 경우, 이전 편집 중인 textarea blur 처리
      if (editingRow !== null && editingRow !== rowIndex) {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
          activeElement.blur();
        }
      }
      // textarea를 클릭해도 해당 row를 활성화하고 편집 상태로
      setActiveRow(rowIndex);
      setEditingRow(rowIndex);
      return;
    }
    
    // 다른 row를 선택할 때 현재 편집 중인 textarea blur 처리
    if (editingRow !== null && editingRow !== rowIndex) {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
        activeElement.blur();
      }
    }
    
    selectionStartRef.current = { rowIndex };
    setIsSelecting(true);
    setSelectedRows(new Set([rowIndex]));
    setActiveRow(rowIndex);
    setEditingRow(null); // 편집 상태 해제
    e.preventDefault();
    e.stopPropagation(); // 상위로 이벤트 전파 방지
  };

  // Title/Description 셀 선택 중
  const handleCellMouseEnter = (rowIndex, e) => {
    if (!isSelecting || !selectionStartRef.current) return;
    
    // 입력 필드 위에서는 선택 확장하지 않음
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    const start = selectionStartRef.current;
    const selected = new Set();
    
    const minRow = Math.min(start.rowIndex, rowIndex);
    const maxRow = Math.max(start.rowIndex, rowIndex);
    
    for (let r = minRow; r <= maxRow; r++) {
      selected.add(r);
    }
    
    setSelectedRows(selected);
  };

  // 셀 선택 종료
  const handleMouseUp = () => {
    setIsSelecting(false);
    selectionStartRef.current = null;
  };

  // ESC 키 처리 (편집 상태에서 선택 상태로 변경)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && editingRow !== null) {
        // 편집 상태 해제하고 선택 상태로 변경
        setEditingRow(null);
        setActiveRow(editingRow);
        setSelectedRows(new Set([editingRow]));
        // textarea 포커스 해제
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
          activeElement.blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingRow]);

  // 전역 붙여넣기 처리 (활성 row가 있을 때, textarea가 포커스되지 않았을 때만)
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (activeRow === null) return;
      
      // textarea나 input이 포커스되어 있으면 기본 동작 허용
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
        // textarea의 onPaste가 처리하도록 함 (탭이 없으면 기본 동작)
        return;
      }
      
      const pasteData = e.clipboardData.getData('text');
      if (!pasteData.includes('\t')) return;
      
      e.preventDefault();
      handlePaste(e);
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [activeRow, handlePaste]);

  // 복사 처리 (row 단위)
  useEffect(() => {
    const handleCopy = (e) => {
      // textarea나 input이 포커스되어 있고 텍스트가 선택되어 있으면 기본 동작 허용
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          // 텍스트가 선택되어 있으면 기본 복사 동작 허용
          return;
        }
      }
      
      if (selectedRows.size === 0) return;
      
      // 선택된 row들을 정렬
      const sortedRows = Array.from(selectedRows).sort((a, b) => a - b);
      const rows = [];
      
      sortedRows.forEach(rowIndex => {
        const noti = notifications[rowIndex];
        if (!noti) {
          rows.push('\t');
          return;
        }
        // Title과 Description을 탭으로 구분하여 복사
        const title = (noti.title || '').replace(/\n/g, '\\n');
        const description = (noti.description || '').replace(/\n/g, '\\n');
        rows.push(`${title}\t${description}`);
      });

      const text = rows.join('\n');
      e.clipboardData.setData('text/plain', text);
      e.preventDefault();
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedRows, notifications]);

  // 에러 카운트
  const errorCount = notifications.filter(noti => noti.hasError).length;

  return (
    <div className="notification-table-container">
      {/* 필터 헤더 */}
      <div className="table-header-controls">
        <div className="table-header-left">
          <span className="notification-count">
            {showOnlyErrors ? `${errorCount}개 에러` : `${notifications.length}개`}
          </span>
          <span className="paste-hint">
            💡 구글시트에서 Title, Description 컬럼만 복사하여 빈 행에 붙여넣으세요
          </span>
        </div>
        <div className="table-header-right">
          {errorCount > 0 && (
            <button
              className={`error-filter-btn ${showOnlyErrors ? 'active' : ''}`}
              onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            >
              {showOnlyErrors ? '전체 보기' : `에러만 보기 (${errorCount})`}
            </button>
          )}
        </div>
      </div>

      {/* 테이블 */}
      <div className="table-wrapper" ref={tableRef}>
        <table className="notification-table">
          <thead>
            <tr>
              <th className="col-level">Level</th>
              <th className="col-icon">Icon</th>
              <th className="col-title">Title</th>
              <th className="col-description">Description</th>
              <th className="col-optional-image">Image</th>
              <th className="col-preview">Preview</th>
              <th className="col-action">삭제</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotifications.length === 0 ? (
              <tr>
                <td colSpan="6" className="table-empty">
                  {showOnlyErrors ? '에러가 없습니다.' : '노티를 추가하거나 붙여넣기하세요.'}
                </td>
              </tr>
            ) : (
              filteredNotifications.map((noti, index) => {
                const actualIndex = showOnlyErrors 
                  ? notifications.findIndex((_, i) => filteredNotifications[index] === notifications[i])
                  : index;
                
                const levelStyle = getLevelBadgeStyle(noti.level);
                
                return (
                  <tr 
                    key={actualIndex} 
                    className={`${noti.hasError ? 'row-error' : ''} ${selectedRows.has(actualIndex) ? 'row-selected' : ''}`}
                  >
                    {/* Level */}
                    <td className="col-level" onMouseDown={(e) => e.stopPropagation()}>
                      <div 
                        className="level-badge-dropdown" 
                        ref={el => levelDropdownRefs.current[actualIndex] = el}
                      >
                        <button
                          type="button"
                          className="level-badge-toggle"
                          onClick={() => setOpenLevelDropdown(openLevelDropdown === actualIndex ? null : actualIndex)}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <span 
                            className="level-badge-item"
                            style={{ 
                              backgroundColor: levelBadgeInfo[noti.level]?.bgColor || '#888',
                              color: levelBadgeInfo[noti.level]?.textColor || '#fff'
                            }}
                          >
                            {levelBadgeInfo[noti.level]?.abbr || noti.level}
                          </span>
                          <span className="level-badge-arrow">▼</span>
                        </button>
                        {openLevelDropdown === actualIndex && (
                          <div className="level-badge-options">
                            {LEVEL_LIST.map((level) => (
                              <div
                                key={level}
                                className={`level-badge-option ${noti.level === level ? 'selected' : ''}`}
                                onClick={() => {
                                  handleRowUpdate(actualIndex, 'level', level);
                                  setOpenLevelDropdown(null);
                                }}
                              >
                                <span 
                                  className="level-badge-item"
                                  style={{ 
                                    backgroundColor: levelBadgeInfo[level]?.bgColor || '#888',
                                    color: levelBadgeInfo[level]?.textColor || '#fff'
                                  }}
                                >
                                  {levelBadgeInfo[level]?.abbr || level}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Icon */}
                    <td className="col-icon" onMouseDown={(e) => e.stopPropagation()}>
                      <IconDropdown
                        value={noti.icon}
                        onChange={(value) => handleRowUpdate(actualIndex, 'icon', value)}
                      />
                    </td>

                    {/* Title */}
                    <td 
                      className="col-title"
                      onMouseDown={(e) => handleCellMouseDown(actualIndex, e)}
                      onMouseEnter={(e) => handleCellMouseEnter(actualIndex, e)}
                    >
                      <textarea
                        value={noti.title || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleRowUpdate(actualIndex, 'title', value);
                        }}
                        className="table-textarea"
                        placeholder="Title 입력"
                        rows={2}
                        onFocus={(e) => {
                          setSelectedRows(new Set([actualIndex]));
                          setActiveRow(actualIndex);
                          setEditingRow(actualIndex);
                        }}
                        onPaste={(e) => {
                          const pasteData = e.clipboardData.getData('text');
                          // 탭이 포함된 경우에만 특별 처리 (구글시트 복사)
                          if (pasteData.includes('\t')) {
                            e.preventDefault();
                            handlePaste(e, actualIndex);
                          }
                          // 탭이 없으면 기본 동작 허용 (일반 텍스트 붙여넣기)
                        }}
                        onCopy={(e) => {
                          // 기본 복사 동작 허용
                        }}
                      />
                    </td>

                    {/* Description */}
                    <td 
                      className="col-description"
                      onMouseDown={(e) => handleCellMouseDown(actualIndex, e)}
                      onMouseEnter={(e) => handleCellMouseEnter(actualIndex, e)}
                    >
                      <textarea
                        value={noti.description || ''}
                        onChange={(e) => handleRowUpdate(actualIndex, 'description', e.target.value)}
                        className="table-textarea"
                        placeholder="Description 입력"
                        rows={2}
                        onFocus={() => {
                          setSelectedRows(new Set([actualIndex]));
                          setActiveRow(actualIndex);
                          setEditingRow(actualIndex);
                        }}
                        onPaste={(e) => {
                          const pasteData = e.clipboardData.getData('text');
                          // 탭이 포함된 경우에만 특별 처리 (구글시트 복사)
                          if (pasteData.includes('\t')) {
                            e.preventDefault();
                            handlePaste(e, actualIndex);
                          }
                          // 탭이 없으면 기본 동작 허용 (일반 텍스트 붙여넣기)
                        }}
                        onCopy={(e) => {
                          // 기본 복사 동작 허용
                        }}
                      />
                    </td>

                    {/* Optional Image */}
                    <td className="col-optional-image" onMouseDown={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={noti.includeImage || false}
                        onChange={(e) => handleRowUpdate(actualIndex, 'includeImage', e.target.checked)}
                      />
                    </td>

                    {/* Preview */}
                    <td className="col-preview">
                      <button
                        className="preview-btn"
                        onClick={() => handlePreview(index)}
                      >
                        미리보기
                      </button>
                    </td>

                    {/* Delete */}
                    <td className="col-action">
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(index)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 미리보기 팝업 */}
      {previewData && (
        <div className="preview-modal-overlay" onClick={handleClosePreview}>
          <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>미리보기</h3>
              <button className="preview-modal-close" onClick={handleClosePreview}>
                ✕
              </button>
            </div>
            <div className="preview-modal-body">
              <PreviewPopup
                selectedIcon={previewData.icon}
                selectedLevel={previewData.level}
                titleKo={previewData.title}
                titleEn=""
                descriptionKo={previewData.description}
                descriptionEn=""
                includeEnglish={false}
                includeImage={previewData.includeImage || false}
                onLineErrorChange={(hasError) => {
                  // 에러 상태 업데이트는 App에서 처리
                }}
                errorReasons={previewData.errorReasons || []}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
