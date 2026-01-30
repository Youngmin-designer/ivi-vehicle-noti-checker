/**
 * DOM 렌더링 기준으로 줄 수를 측정합니다.
 * lines = round(scrollHeight / lineHeight)
 * @param {HTMLElement} element - 측정할 DOM 요소
 * @param {number|string} lineHeight - 기준 line-height (px) 또는 'auto'
 * @returns {number} - 계산된 줄 수
 */
export function measureLines(element, lineHeight) {
  if (!element) return 0;
  
  const scrollHeight = element.scrollHeight;
  
  // line-height가 'auto' 또는 'normal'인 경우 computed style에서 가져옴
  let actualLineHeight = lineHeight;
  if (lineHeight === 'auto' || lineHeight === 'normal' || !lineHeight) {
    const computedStyle = window.getComputedStyle(element);
    const computedLineHeight = computedStyle.lineHeight;
    
    if (computedLineHeight === 'normal') {
      // 'normal'인 경우 font-size의 약 1.2배로 추정
      const fontSize = parseFloat(computedStyle.fontSize);
      actualLineHeight = fontSize * 1.2;
    } else {
      actualLineHeight = parseFloat(computedLineHeight);
    }
  }
  
  return Math.round(scrollHeight / actualLineHeight);
}

/**
 * 폰트 로딩 완료 후 콜백을 실행합니다.
 * @param {Function} callback - 폰트 로딩 완료 후 실행할 함수
 */
export async function onFontsReady(callback) {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
    callback();
  } else {
    // Fallback for browsers without document.fonts
    callback();
  }
}
