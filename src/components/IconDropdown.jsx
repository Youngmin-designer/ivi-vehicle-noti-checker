import { useState, useRef, useEffect } from 'react';
import { ICON_LIST, WHITE_ICONS } from '../constants';
import { getIconUrl } from '../utils/icon';

export default function IconDropdown({ value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 드롭다운 열릴 때 검색 인풋에 포커스
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // 표시용 이름 (소문자, 언더바 유지)
  const formatIconName = (icon) => {
    if (!icon) return '';
    return icon.replace('.svg', '').toLowerCase();
  };

  const isWhiteIcon = (icon) => WHITE_ICONS.includes(icon);

  // 검색 필터링 (언더바 없이도 검색 가능)
  const filteredIcons = ICON_LIST.filter((icon) => {
    const iconName = icon.replace('.svg', '').toLowerCase();
    const iconNameNoUnderscore = iconName.replace(/_/g, '').replace(/-/g, '');
    const query = searchQuery
      .toLowerCase()
      .replace(/_/g, '')
      .replace(/-/g, '')
      .replace(/ /g, '');
    return iconName.includes(query) || iconNameNoUnderscore.includes(query);
  });

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    // 닫힐 때만 검색 초기화
    if (isOpen) setSearchQuery('');
  };

  const handleSelect = (icon) => {
    onChange(icon);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'Enter' && filteredIcons.length > 0) {
      handleSelect(filteredIcons[0]);
    }
  };

  const hasValue = value && value.trim();

  return (
    <div className="icon-dropdown" ref={dropdownRef}>
      {/* 선택된 아이콘 표시 (토글 버튼) */}
      <button
        type="button"
        className={`icon-dropdown-toggle ${disabled ? 'disabled' : ''} ${
          !hasValue ? 'placeholder' : ''
        }`}
        onClick={handleToggle}
        disabled={disabled}
      >
        {hasValue ? (
          <>
            <span
              className={`icon-dropdown-preview-wrapper ${
                isWhiteIcon(value) ? 'dark-bg' : ''
              }`}
            >
              <img
                src={getIconUrl(value)}
                alt={value}
                className="icon-dropdown-preview"
                loading="lazy"
              />
            </span>
            <span className="icon-dropdown-text">{formatIconName(value)}</span>
          </>
        ) : (
          <span className="icon-dropdown-placeholder">[Icon 선택]</span>
        )}
        <span className={`icon-dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div className="icon-dropdown-panel">
          {/* 검색 입력 필드 */}
          <div className="icon-dropdown-search">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="아이콘 검색..."
              className="icon-dropdown-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="icon-dropdown-search-clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* 아이콘 리스트 */}
          <ul className="icon-dropdown-list">
            {filteredIcons.length > 0 ? (
              filteredIcons.map((icon) => (
                <li
                  key={icon}
                  className={`icon-dropdown-item ${icon === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(icon)}
                >
                  <span
                    className={`icon-dropdown-preview-wrapper ${
                      isWhiteIcon(icon) ? 'dark-bg' : ''
                    }`}
                  >
                    <img
                      src={getIconUrl(icon)}
                      alt={icon}
                      className="icon-dropdown-preview"
                      loading="lazy"
                    />
                  </span>
                  <span className="icon-dropdown-text">{formatIconName(icon)}</span>
                </li>
              ))
            ) : (
              <li className="icon-dropdown-empty">검색 결과가 없습니다</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
