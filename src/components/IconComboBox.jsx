import { useState, useRef, useEffect } from 'react';
import { ICON_LIST, WHITE_ICONS } from '../constants';

export default function IconComboBox({ value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const inputRef = useRef(null);

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
    const query = searchQuery.toLowerCase().replace(/_/g, '').replace(/-/g, '').replace(/ /g, '');
    return iconName.includes(query) || iconNameNoUnderscore.includes(query);
  });

  // 입력값이 아이콘 목록에 있는지 확인
  const isValidIcon = (iconName) => {
    if (!iconName) return false;
    const normalized = iconName.toLowerCase().trim();
    return ICON_LIST.some(icon => 
      icon.toLowerCase() === normalized || 
      icon.toLowerCase() === `${normalized}.svg` ||
      icon.toLowerCase().replace('.svg', '') === normalized
    );
  };

  // 입력값을 정규화 (아이콘 이름으로 변환)
  const normalizeIconName = (input) => {
    if (!input) return '';
    const normalized = input.toLowerCase().trim();
    const found = ICON_LIST.find(icon => 
      icon.toLowerCase() === normalized || 
      icon.toLowerCase() === `${normalized}.svg` ||
      icon.toLowerCase().replace('.svg', '') === normalized
    );
    return found || input; // 찾으면 정규화된 이름, 없으면 원본 반환
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue); // 정규화는 나중에
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (isOpen) {
      setSearchQuery('');
    }
  };

  const handleSelect = (icon) => {
    onChange(icon);
    setIsOpen(false);
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.blur();
    }
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
  const displayIcon = hasValue && isValidIcon(value) ? normalizeIconName(value) : value;

  return (
    <div className="icon-combobox" ref={dropdownRef}>
      <div className="icon-combobox-input-wrapper">
        {/* 아이콘 미리보기 */}
        {hasValue && isValidIcon(value) && (
          <span className={`icon-combobox-preview-wrapper ${isWhiteIcon(displayIcon) ? 'dark-bg' : ''}`}>
            <img
              src={`${import.meta.env.BASE_URL}icon_svg/${displayIcon}`}
              alt={displayIcon}
              className="icon-combobox-preview"
            />
          </span>
        )}
        
        {/* 텍스트 입력 필드 */}
        <input
          ref={inputRef}
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          onFocus={() => {
            // 입력 필드 포커스 시 드롭다운은 열어두지 않음
          }}
          disabled={disabled}
          placeholder="아이콘 이름 입력 또는 선택"
          className="icon-combobox-input"
        />
        
        {/* 드롭다운 토글 버튼 */}
        <button
          type="button"
          className="icon-combobox-toggle"
          onClick={handleToggle}
          disabled={disabled}
        >
          <span className={`icon-combobox-arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </button>
      </div>

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div className="icon-combobox-panel">
          {/* 검색 입력 필드 */}
          <div className="icon-combobox-search">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="아이콘 검색..."
              className="icon-combobox-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="icon-combobox-search-clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* 아이콘 리스트 */}
          <ul className="icon-combobox-list">
            {filteredIcons.length > 0 ? (
              filteredIcons.map((icon) => (
                <li
                  key={icon}
                  className={`icon-combobox-item ${icon === displayIcon ? 'selected' : ''}`}
                  onClick={() => handleSelect(icon)}
                >
                  <span className={`icon-combobox-preview-wrapper ${isWhiteIcon(icon) ? 'dark-bg' : ''}`}>
                    <img
                      src={`${import.meta.env.BASE_URL}icon_svg/${icon}`}
                      alt={icon}
                      className="icon-combobox-preview"
                    />
                  </span>
                  <span className="icon-combobox-text">{formatIconName(icon)}</span>
                </li>
              ))
            ) : (
              <li className="icon-combobox-empty">
                검색 결과가 없습니다
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
