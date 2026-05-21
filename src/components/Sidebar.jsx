import React, { useRef } from 'react';
import { Cookie, ChefHat, Tag, Download, Upload, Trash2 } from 'lucide-react';

export default function Sidebar({
  categories = [],
  activeCategory,
  onSelectCategory,
  tags = [],
  activeTags = [],
  onToggleTag,
  onExport,
  onImport,
  onResetDB,
  promptCount = 0
}) {
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <aside className="sidebar glass-panel">
      <div className="logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cookie className="logo-accent" size={24} style={{ transform: 'rotate(-15deg)' }} />
          <span>Prompt<span className="logo-accent">Bakery</span></span>
        </div>
        <span className="category-count" title="총 레시피 개수">{promptCount}</span>
      </div>

      {tags.length > 0 && (
        <div className="sidebar-section">
          <span className="sidebar-title">토핑 필터 (태그)</span>
          <div className="tag-cloud">
            {tags.map((tag) => {
              const isActive = activeTags.includes(tag);
              return (
                <span
                  key={tag}
                  className={`tag-badge ${isActive ? 'active' : ''}`}
                  onClick={() => onToggleTag(tag)}
                >
                  <Tag size={10} style={{ marginRight: '4px', display: 'inline' }} />
                  {tag}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="sidebar-section" style={{ marginTop: 'auto' }}>
        <span className="sidebar-title">주방 도구 (백업)</span>
        <div className="settings-section">
          <div className="settings-row">
            <button 
              className="btn btn-secondary btn-icon-only flex-grow"
              onClick={onExport}
              title="레시피 백업하기 (JSON 다운로드)"
            >
              <Download size={16} />
              <span>백업</span>
            </button>
            <button 
              className="btn btn-secondary btn-icon-only flex-grow"
              onClick={handleImportClick}
              title="레시피 불러오기 (JSON 파일 선택)"
            >
              <Upload size={16} />
              <span>복원</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json"
              onChange={handleFileChange}
            />
          </div>
          
          <button 
            className="btn btn-danger btn-icon-only" 
            onClick={onResetDB}
            style={{ width: '100%' }}
            title="오븐 데이터 전체 삭제"
          >
            <Trash2 size={16} />
            <span>오븐 초기화</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
