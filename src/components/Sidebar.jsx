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
  promptCount = 0,
  user = null,
  isCloudConfigured = false,
  onOpenAuth,
  onLogout,
  onOpenCloudSettings
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

      <div className="sidebar-section" style={{ marginTop: 'auto', marginBottom: '0.75rem' }}>
        <span className="sidebar-title">클라우드 동기화 (기기 간 연동)</span>
        <div className="settings-section">
          {isCloudConfigured ? (
            user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="cloud-status-indicator synced">
                  <div className="status-dot green"></div>
                  <span className="email-text" title={user.email}>{user.email}</span>
                </div>
                <button className="btn btn-secondary" onClick={onLogout} style={{ width: '100%', fontSize: '0.75rem', padding: '0.45rem' }}>
                  동기화 로그아웃
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={onOpenAuth} style={{ width: '100%', fontSize: '0.75rem', padding: '0.45rem' }}>
                동기화 로그인 / 가입
              </button>
            )
          ) : (
            <button className="btn btn-secondary" onClick={onOpenCloudSettings} style={{ width: '100%', borderStyle: 'dashed', fontSize: '0.75rem', padding: '0.45rem' }}>
              서버 연동 설정
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-section">
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
