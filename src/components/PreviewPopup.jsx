import { useEffect, useRef, useState, useCallback } from 'react';
import { measureLines, onFontsReady } from '../utils/measureLines';
import { LEVEL_STYLES, FONT_LIST } from '../constants';
import { getIconUrl } from '../utils/icon';
import html2canvas from 'html2canvas';

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

// 프리뷰 스케일 (64% = 80% of 80%)
const PREVIEW_SCALE = 0.64;

// 언어 목록
const LANGUAGES = {
  ko: { id: 'ko', name: '한글' },
  en: { id: 'en', name: 'ENGLISH' },
};

// 텍스트에서 \n을 줄바꿈으로 변환
const renderTextWithLineBreaks = (text) => {
  if (!text) return null;
  const processedText = text.replace(/\\n/g, '\n');
  return processedText.split('\n').map((line, index, array) => (
    <span key={index}>
      {line}
      {index < array.length - 1 && <br />}
    </span>
  ));
};

// 이미지 영역 너비
const IMAGE_AREA_WIDTH = 120;

// 기본 레벨 스타일 (information 기준)
const DEFAULT_LEVEL_STYLE = {
  background: '#ffffff',
  borderRadius: 0,
  border: '2px solid #DADADA',
  textColor: '#000000',
  iconColor: null, // 원본 색상 유지
  layout: 'horizontal',
  iconSize: 48,
  padding: { top: 24, right: 24, bottom: 24, left: 24 },
  iconTextGap: 24,
  textAreaWidth: 390,
  hasTitle: true,
};

// 개별 프리뷰 카드 컴포넌트
function PreviewCard({
  font,
  language,
  selectedIcon,
  selectedLevel,
  title,
  description,
  includeImage,
  onLineCountChange,
  errorReasons = [],
}) {
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const [titleLines, setTitleLines] = useState(0);
  const [descLines, setDescLines] = useState(0);

  const levelStyle = LEVEL_STYLES[selectedLevel] || DEFAULT_LEVEL_STYLE;
  const isCritical = selectedLevel === 'critical';
  const isVertical = levelStyle.layout === 'vertical';

  const criticalDescSpec = levelStyle.description || {};

  // title과 description 중 하나만 있는지 확인 (horizontal 레이아웃에서만)
  const hasTitle = levelStyle.hasTitle && title && title.trim();
  const hasDesc = description && description.trim();
  const isSingleText = !isVertical && ((hasTitle && !hasDesc) || (!hasTitle && hasDesc));

  const calculateLines = useCallback(() => {
    if (isCritical) {
      const dLines = measureLines(descRef.current, criticalDescSpec.lineHeight);
      setTitleLines(0);
      setDescLines(dLines);
    } else {
      const tLines = measureLines(titleRef.current, BASE_SPECS.title.lineHeight);
      const dLines = measureLines(descRef.current, BASE_SPECS.description.lineHeight);
      setTitleLines(tLines);
      setDescLines(dLines);
    }
  }, [isCritical, criticalDescSpec]);

  useEffect(() => {
    onFontsReady(() => {
      requestAnimationFrame(() => {
        calculateLines();
      });
    });
  }, [title, description, font.id, selectedLevel, includeImage, calculateLines]);

  const totalLines = titleLines + descLines;
  const maxLines = isCritical ? criticalDescSpec.maxLines : BASE_SPECS.maxTotalLines;
  const isOverLimit = totalLines > maxLines;

  // 줄 수 초과 여부를 상위로 전달
  useEffect(() => {
    if (onLineCountChange) {
      onLineCountChange(
        font.id,
        language.id,
        isOverLimit,
        totalLines,
        maxLines,
        titleLines,
        descLines
      );
    }
  }, [isOverLimit, font.id, language.id, onLineCountChange, totalLines, maxLines, titleLines, descLines]);

  // Noto Sans KR (Asteon)은 corner radius 32
  const isAsteonTheme = font.id === 'Noto Sans KR';
  const cornerRadius = isAsteonTheme ? 32 : levelStyle.borderRadius;

  // 이미지 포함 시 텍스트 영역 너비 조정 (horizontal 레이아웃에서만)
  const textAreaWidth = !isVertical && includeImage ? 270 : levelStyle.textAreaWidth;

  // 이미지가 있을 때 오른쪽 패딩을 0으로 (이미지가 오른쪽 끝까지)
  const rightPadding = !isVertical && includeImage ? 0 : levelStyle.padding.right;

  // border 색상 계산 (CSS에서 사용)
  let borderColor = null;
  if (levelStyle.border && levelStyle.border !== 'none') {
    const borderParts = levelStyle.border.split(' ');
    borderColor = borderParts[borderParts.length - 1];
  } else if (selectedLevel === 'urgent') {
    borderColor = levelStyle.background; // urgent는 배경색으로 border
  }

  const popupStyle = {
    width: BASE_SPECS.popupWidth,
    padding: `${levelStyle.padding.top}px ${rightPadding}px ${levelStyle.padding.bottom}px ${levelStyle.padding.left}px`,
    fontFamily: font.id,
    backgroundColor: levelStyle.background,
    borderRadius: cornerRadius,
    boxSizing: 'border-box',
    overflow: 'hidden',
    border: !includeImage && borderColor ? `2px solid ${borderColor}` : 'none',
  };

  const iconFilter =
    levelStyle.iconColor === '#ffffff' ? 'brightness(0) invert(1)' : 'none';

  return (
    <div
      className="preview-card-scale-wrapper"
      style={{
        width: BASE_SPECS.popupWidth * PREVIEW_SCALE,
        height: 'auto',
        position: 'relative',
      }}
    >
      <div
        className={`popup-card ${isVertical ? 'vertical' : 'horizontal'} ${
          isSingleText ? 'single-text' : ''
        } ${includeImage && borderColor ? 'with-image-border' : ''}`}
        style={{
          ...popupStyle,
          transform: `scale(${PREVIEW_SCALE})`,
          transformOrigin: 'top left',
          '--popup-border-color': borderColor || 'transparent',
        }}
      >
        <div
          className="popup-icon"
          style={{
            width: levelStyle.iconSize,
            height: levelStyle.iconSize,
            minWidth: levelStyle.iconSize,
            marginBottom: isVertical ? levelStyle.iconTextGap : 0,
            marginRight: isVertical ? 0 : levelStyle.iconTextGap,
          }}
        >
          {selectedIcon ? (
            <img
              src={getIconUrl(selectedIcon)}
              alt={selectedIcon}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: iconFilter,
              }}
              loading="lazy"
            />
          ) : (
            <div
              style={{
                width: levelStyle.iconSize,
                height: levelStyle.iconSize,
                backgroundColor: '#e0e0e0',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: 10,
              }}
            >
              Icon
            </div>
          )}
        </div>

        <div
          className="popup-text"
          style={{
            width: textAreaWidth,
            textAlign: isVertical ? 'center' : 'left',
          }}
        >
          {levelStyle.hasTitle && hasTitle && (
            <div
              ref={titleRef}
              className="popup-title"
              style={{
                fontSize: BASE_SPECS.title.fontSize,
                fontWeight: BASE_SPECS.title.fontWeight,
                lineHeight: `${BASE_SPECS.title.lineHeight}px`,
                color: levelStyle.textColor,
              }}
            >
              {renderTextWithLineBreaks(title)}
            </div>
          )}

          {hasDesc && (
            <div
              ref={descRef}
              className="popup-description"
              style={
                isCritical
                  ? {
                      fontSize: criticalDescSpec.fontSize,
                      fontWeight: criticalDescSpec.fontWeight,
                      lineHeight:
                        criticalDescSpec.lineHeight === 'auto'
                          ? 'normal'
                          : `${criticalDescSpec.lineHeight}px`,
                      color: levelStyle.textColor,
                      marginTop: 0,
                    }
                  : {
                      fontSize: BASE_SPECS.description.fontSize,
                      fontWeight: BASE_SPECS.description.fontWeight,
                      lineHeight: `${BASE_SPECS.description.lineHeight}px`,
                      color: levelStyle.textColor === '#000000' ? '#333333' : levelStyle.textColor,
                      marginTop: hasTitle ? 4 : 0,
                    }
              }
            >
              {renderTextWithLineBreaks(description)}
            </div>
          )}
        </div>

        {/* Optional Image 영역 (horizontal 레이아웃에서만) */}
        {!isVertical && includeImage && (
          <div
            className="popup-image-area"
            style={{
              width: IMAGE_AREA_WIDTH,
              backgroundColor: '#F7F7F7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#aaa',
              fontSize: 12,
              flexShrink: 0,
              marginLeft: 24,
              marginTop: -levelStyle.padding.top,
              marginBottom: -levelStyle.padding.bottom,
              alignSelf: 'stretch',
              borderTopRightRadius: cornerRadius,
              borderBottomRightRadius: cornerRadius,
            }}
          >
            image
          </div>
        )}
      </div>

      {/* 에러 정보 표시 (왼쪽 아래) */}
      {(isOverLimit || errorReasons.length > 0) && (
        <div
          className="preview-error-info"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: 'bottom left',
            zIndex: 10,
          }}
        >
          {isOverLimit && (
            <div className="error-item">
              <span className="error-icon">⚠</span>
              <span>
                문구 수 초과 ({totalLines} / {maxLines})
              </span>
            </div>
          )}
          {errorReasons.map((reason, idx) => (
            <div key={idx} className="error-item">
              <span className="error-icon">⚠</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PreviewPopup({
  selectedIcon,
  selectedLevel,
  titleKo,
  titleEn,
  descriptionKo,
  descriptionEn,
  includeEnglish,
  includeImage,
  onLineErrorChange,
  errorReasons = [],
}) {
  const [lineData, setLineData] = useState({});

  // 표시할 언어 목록
  const visibleLanguages = includeEnglish ? [LANGUAGES.ko, LANGUAGES.en] : [LANGUAGES.ko];

  // 줄 수 정보 콜백
  const handleLineCountChange = useCallback(
    (fontId, langId, isOverLimit, totalLines, maxLines, titleLines, descLines) => {
      setLineData((prev) => {
        const key = `${fontId}-${langId}`;
        const newData = { isOverLimit, totalLines, maxLines, titleLines, descLines };
        if (JSON.stringify(prev[key]) === JSON.stringify(newData)) return prev;
        return { ...prev, [key]: newData };
      });
    },
    []
  );

  // 전체 줄 수 에러 여부를 상위로 전달
  useEffect(() => {
    if (onLineErrorChange) {
      const hasAnyError = Object.values(lineData).some((v) => v?.isOverLimit === true);
      onLineErrorChange(hasAnyError);
    }
  }, [lineData, onLineErrorChange]);

  // PNG 복사 함수
  const handleCopyPNG = async (cardElement) => {
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard
          .write([item])
          .then(() => {
            alert('이미지가 클립보드에 복사되었습니다.');
          })
          .catch((err) => {
            console.error('복사 실패:', err);
            alert('이미지 복사에 실패했습니다.');
          });
      }, 'image/png');
    } catch (error) {
      console.error('PNG 변환 실패:', error);
      alert('이미지 변환에 실패했습니다.');
    }
  };

  const scaledWidth = BASE_SPECS.popupWidth * PREVIEW_SCALE;

  return (
    <div className="preview-container">
      <div className="preview-header">
        <span className="preview-title">Preview</span>
      </div>

      <div className="preview-grid-vertical">
        {FONT_LIST.map((font) => {
          return (
            <div key={font.id} className="preview-font-container">
              {/* 서체 헤더 */}
              <div className="preview-font-header-row preview-font-header-static">
                <span className="font-name">{font.name}</span>
              </div>

              {/* 프리뷰 카드 */}
              <div className="preview-lang-group preview-lang-responsive">
                <div className="preview-card-wrapper">
                  {/* 이미지 복사 버튼 */}
                  <div
                    className="preview-lang-header"
                    style={{
                      width: scaledWidth,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      className="preview-copy-png-btn"
                      onClick={async () => {
                        const cardElement = document.querySelector(
                          `[data-card-id="${font.id}"] .popup-card`
                        );
                        if (cardElement) {
                          await handleCopyPNG(cardElement);
                        }
                      }}
                      title="PNG로 복사"
                    >
                      이미지 복사
                    </button>
                  </div>

                  <div data-card-id={font.id}>
                    <PreviewCard
                      font={font}
                      language={visibleLanguages[0]}
                      selectedIcon={selectedIcon}
                      selectedLevel={selectedLevel}
                      title={titleKo}
                      description={descriptionKo}
                      includeImage={includeImage}
                      onLineCountChange={handleLineCountChange}
                      errorReasons={errorReasons}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
