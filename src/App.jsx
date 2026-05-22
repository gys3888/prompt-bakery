import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import PromptGrid from './components/PromptGrid';
import PromptForm from './components/PromptForm';
import PromptDetailModal from './components/PromptDetailModal';
import AuthModal from './components/AuthModal';
import CloudSettingsModal from './components/CloudSettingsModal';
import { 
  getAllPrompts, addPrompt, updatePrompt, deletePrompt, incrementUsageCount,
  getCloudPrompts, addCloudPrompt, updateCloudPrompt, deleteCloudPrompt, incrementCloudUsageCount, syncLocalToCloud
} from './utils/db';
import { getSupabaseConfig, getSupabaseClient } from './utils/supabaseClient';
import { Plus, Search, Info, Check, Home, Settings, Cookie, Download, Upload, Trash2 } from 'lucide-react';
import { compressImage } from './utils/imageCompressor';

const BAKERY_SAMPLE_PROMPTS = [
  {
    id: 'sample-1',
    title: '따뜻한 감성 코티지하우스 (예시)',
    category: 'Midjourney',
    promptText: 'A cozy cottagecore kitchen interior with a [furniture], sun beams shining through the window, pastel [color] curtains, ghibli aesthetic, warm soft lighting, highly detailed illustration, 8k --ar 16:9',
    tags: ['코티지', '지브리', '따뜻한', '인테리어'],
    compressedImage: '',
    usageCount: 15,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-2',
    title: '동글동글 딸기 컵케이크 (예시)',
    category: 'Stable Diffusion',
    promptText: 'A cute 3D rendering of a strawberry cupcake with [topping] on top, pastel lavender background, claymation style, soft ambient occlusion, cute toy design, isometric view, trending on Dribbble',
    tags: ['딸기', '3D', '클레이', '귀여운'],
    compressedImage: '',
    usageCount: 8,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-3',
    title: '인스타그램 바이럴 카피 레시피 (예시)',
    category: 'ChatGPT',
    promptText: 'Write a high-converting marketing copy for a [product_name] that solves [customer_problem]. Emphasize the core benefits: [benefit_1] and [benefit_2]. The tone should be [tone]. Keep it under 200 words and include a strong call to action.',
    tags: ['마케팅', '글쓰기', '카피라이팅'],
    compressedImage: '',
    usageCount: 22,
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  const [prompts, setPrompts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'usage', 'alphabetical'
  
  // Mobile Tab State
  const [activeTab, setActiveTab] = useState('home'); // 'home' or 'settings'
  
  // Cloud & Auth State
  const [user, setUser] = useState(null);
  const [isCloudConfigured, setIsCloudConfigured] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCloudSettingsOpen, setIsCloudSettingsOpen] = useState(false);

  // Modals & Popups
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [prefilledImage, setPrefilledImage] = useState('');
  
  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: '' });

  // Initialize Supabase configuration and auth state listener
  useEffect(() => {
    const initSupabase = async () => {
      const { isConfigured } = getSupabaseConfig();
      setIsCloudConfigured(isConfigured);
      
      if (isConfigured) {
        const client = getSupabaseClient();
        if (client) {
          try {
            // Get current session
            const { data: { session } } = await client.auth.getSession();
            if (session?.user) {
              setUser(session.user);
            }
            
            // Listen for auth changes
            const { data: { subscription } } = client.auth.onAuthStateChange((event, currentSession) => {
              if (currentSession?.user) {
                setUser(currentSession.user);
              } else {
                setUser(null);
              }
            });
            
            return () => {
              subscription?.unsubscribe();
            };
          } catch (err) {
            console.error('Supabase auth state error:', err);
          }
        }
      } else {
        setUser(null);
      }
    };
    initSupabase();
  }, []);

  // Reload prompts whenever user state changes
  useEffect(() => {
    loadPrompts(user);
  }, [user]);

  // Global paste handler for images (runs only when form is closed)
  useEffect(() => {
    const handleGlobalPaste = async (e) => {
      if (isFormOpen) return; // Let PromptForm handle it if it is already open

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            showToast('이미지 반죽하는 중... 🥖');
            try {
              const compressedData = await compressImage(file, 600, 600, 0.6);
              setPrefilledImage(compressedData);
              setEditingPrompt(null);
              setIsFormOpen(true);
              showToast('이미지가 레시피에 추가되었습니다! 🥐');
            } catch (err) {
              console.error('글로벌 이미지 붙여넣기 오류:', err);
              alert('이미지 압축에 실패했습니다: ' + err);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [isFormOpen]);

  const loadPrompts = async (currentUser = user) => {
    try {
      const { isConfigured } = getSupabaseConfig();
      if (isConfigured && currentUser) {
        // Load from Cloud
        const cloudData = await getCloudPrompts();
        setPrompts(cloudData);
      } else {
        // Load from local IndexedDB
        let data = await getAllPrompts();
        if (data.length === 0) {
          for (const sample of BAKERY_SAMPLE_PROMPTS) {
            await addPrompt(sample);
          }
          data = await getAllPrompts();
        }
        setPrompts(data);
      }
    } catch (err) {
      console.error('Error loading prompts:', err);
      const { url } = getSupabaseConfig();
      showToast(`레시피 로드 실패 (${url || '로컬'}): ${err.message || err}`);
    }
  };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2000);
  };

  // Tags list derived from prompts
  const allTags = useMemo(() => {
    const tagCounts = {};
    prompts.forEach((p) => {
      if (p.tags) {
        p.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    return Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
  }, [prompts]);

  const handleToggleTag = (tag) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Filtered prompts based on search, tags, and selected sort option
  const filteredPrompts = useMemo(() => {
    const filtered = prompts.filter((p) => {
      if (activeTags.length > 0) {
        const hasAllTags = activeTags.every((t) => p.tags && p.tags.includes(t));
        if (!hasAllTags) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesPromptText = p.promptText.toLowerCase().includes(query);
        const matchesTags = p.tags && p.tags.some((t) => t.toLowerCase().includes(query));
        return matchesTitle || matchesPromptText || matchesTags;
      }

      return true;
    });

    if (sortBy === 'usage') {
      return filtered.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    } else if (sortBy === 'alphabetical') {
      return filtered.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    } else {
      // Default: 'newest'
      return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [prompts, searchQuery, activeTags, sortBy]);
  const handleSavePrompt = async (promptData) => {
    try {
      const isCloud = isCloudConfigured && user;
      if (editingPrompt) {
        if (isCloud) {
          await updateCloudPrompt(promptData);
        } else {
          await updatePrompt(promptData);
        }
        showToast('레시피가 수정되었습니다! 🥖');
      } else {
        if (isCloud) {
          await addCloudPrompt(promptData);
        } else {
          await addPrompt(promptData);
        }
        showToast('맛있는 레시피가 구워졌습니다! 🥐');
      }
      loadPrompts();
      setIsFormOpen(false);
      setEditingPrompt(null);
    } catch (err) {
      console.error(err);
      showToast('레시피 저장 실패');
    }
  };

  const handleDeletePrompt = async (id) => {
    if (window.confirm('이 레시피를 정말 삭제하시겠습니까?')) {
      try {
        const isCloud = isCloudConfigured && user;
        if (isCloud) {
          await deleteCloudPrompt(id);
        } else {
          await deletePrompt(id);
        }
        showToast('레시피 삭제 완료');
        loadPrompts();
        if (selectedPrompt?.id === id) {
          setSelectedPrompt(null);
        }
      } catch (err) {
        console.error(err);
        showToast('레시피 삭제 실패');
      }
    }
  };

  const handleCopyPrompt = async (id) => {
    try {
      const isCloud = isCloudConfigured && user;
      if (isCloud) {
        await incrementCloudUsageCount(id);
        const cloudData = await getCloudPrompts();
        setPrompts(cloudData);
      } else {
        await incrementUsageCount(id);
        const localData = await getAllPrompts();
        setPrompts(localData);
      }
      showToast('클립보드에 프롬프트 복사 완료! 📋');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthSuccess = async (authUser) => {
    setUser(authUser);
    setIsAuthOpen(false);
    showToast(`${authUser.email} 계정으로 로그인했습니다!`);
    
    try {
      const localPrompts = await getAllPrompts();
      const nonSampleLocal = localPrompts.filter(p => !p.id.startsWith('sample-'));
      
      if (nonSampleLocal.length > 0) {
        if (window.confirm(`현재 브라우저에 저장되어 있는 레시피 ${nonSampleLocal.length}개를 클라우드 계정으로 백업(동기화)하시겠습니까?\n(동기화 시 다른 기기에서도 이 레시피들을 보실 수 있습니다.)`)) {
          showToast('클라우드로 레시피를 굽는 중... 🥐');
          const uploadedCount = await syncLocalToCloud();
          showToast(`${uploadedCount}개의 레시피가 성공적으로 클라우드에 구워졌습니다!`);
        }
      }
    } catch (err) {
      console.error('Migration error:', err);
      showToast(`동기화 백업 실패: ${err.message || err}`);
    }
    
    loadPrompts(authUser);
  };

  const handleLogout = async () => {
    if (window.confirm('로그아웃하시겠습니까?\n로그아웃 후에는 로컬 모드로 전환됩니다.')) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.auth.signOut();
        } catch (err) {
          console.error(err);
        }
      }
      setUser(null);
      showToast('로그아웃되었습니다. 로컬 오븐으로 전환합니다.');
    }
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(prompts, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `promptbakery_백업_${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      showToast('레시피가 안전하게 백업되었습니다! 💾');
    } catch (err) {
      console.error(err);
      showToast('백업 실패');
    }
  };

  const handleImport = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!Array.isArray(importedData)) {
          throw new Error('데이터 형식이 올바르지 않습니다.');
        }

        for (const item of importedData) {
          if (item.title && item.promptText && item.category) {
            if (!item.id) item.id = Date.now().toString() + Math.random().toString().substr(2, 5);
            if (!item.createdAt) item.createdAt = new Date().toISOString();
            await updatePrompt(item);
          }
        }
        
        showToast('백업 데이터를 불러왔습니다! 🍞');
        loadPrompts();
      } catch (err) {
        console.error(err);
        alert('레시피 불러오기 실패. 파일 형식을 확인해주세요: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDB = async () => {
    if (window.confirm('경고: 저장된 모든 레시피와 참고 스크린샷 이미지가 이 기기에서 완전 삭제됩니다. 초기화하시겠습니까?')) {
      try {
        const dbRequest = indexedDB.open('PromptManagerDB', 1);
        dbRequest.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction('prompts', 'readwrite');
          const store = transaction.objectStore('prompts');
          const clearRequest = store.clear();
          clearRequest.onsuccess = () => {
            showToast('오븐을 깨끗하게 비웠습니다.');
            setPrompts([]);
          };
        };
      } catch (err) {
        console.error(err);
        showToast('오븐 청소 실패');
      }
    }
  };

  const handleAddClick = () => {
    setEditingPrompt(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (prompt) => {
    setEditingPrompt(prompt);
    setIsFormOpen(true);
  };

  const handleSelectPrompt = (prompt) => {
    setSelectedPrompt(prompt);
  };

  const handleMobileImportChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
      e.target.value = '';
    }
  };

  const mobileFileInputRef = React.useRef(null);

  return (
    <div className="app-container">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar
        tags={allTags}
        activeTags={activeTags}
        onToggleTag={handleToggleTag}
        onExport={handleExport}
        onImport={handleImport}
        onResetDB={handleResetDB}
        promptCount={prompts.length}
        user={user}
        isCloudConfigured={isCloudConfigured}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenCloudSettings={() => setIsCloudSettingsOpen(true)}
      />

      {/* Main dashboard content */}
      <main className="main-content">
        <header className="top-bar">
          <div className="title-section">
            <h1>
              <Cookie className="logo-accent" size={28} style={{ transform: 'rotate(-15deg)', color: 'var(--accent-orange)' }} />
              <span>Prompt<span className="logo-accent">Bakery</span></span>
            </h1>
            <p>스크린샷을 캡처하고 변수를 간편하게 채워 복사하는 나만의 프롬프트 빵집.</p>
          </div>

          <div className="search-filter-bar">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="제목, 태그 등으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              title="정렬 기준"
            >
              <option value="newest">최신 등록순</option>
              <option value="usage">자주 사용한 순</option>
              <option value="alphabetical">이름 가나다순</option>
            </select>

            <button className="btn btn-primary" onClick={handleAddClick}>
              <Plus size={16} />
              <span>레시피 추가</span>
            </button>
          </div>
        </header>

        {/* Info banner about paste shortcut */}
        <div className="glass-panel" style={{
          padding: '0.65rem 1rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}>
          <Info size={14} style={{ color: 'var(--accent-orange)', flexShrink: 0 }} />
          <span>꿀팁: 아무 곳에서나 <strong>Cmd + V</strong> (윈도우는 <strong>Ctrl + V</strong>)를 누르면 클립보드의 캡처 이미지가 즉시 저장소에 들어가요!</span>
        </div>

        {/* Toggle between Home feed and Settings View on mobile */}
        {activeTab === 'home' ? (
          <PromptGrid
            prompts={filteredPrompts}
            onCopy={handleCopyPrompt}
            onEdit={handleEditClick}
            onDelete={handleDeletePrompt}
            onSelectPrompt={handleSelectPrompt}
          />
        ) : (
          /* Settings container rendered inline on mobile width settings tab */
          <div className="settings-mobile-container">
            <h3 style={{ fontFamily: 'var(--font-logo)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>클라우드 동기화</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              어느 기기에서나 내 레시피를 동일하게 보고 편집할 수 있도록 클라우드에 연동합니다.
            </p>
            
            <div className="settings-section" style={{ marginBottom: '1.5rem' }}>
              {isCloudConfigured ? (
                user ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="cloud-status-indicator synced" style={{ padding: '0.75rem 1rem' }}>
                      <div className="status-dot green"></div>
                      <span className="email-text" style={{ fontSize: '0.875rem' }}>{user.email} (연동 완료)</span>
                    </div>
                    <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%', fontSize: '0.8125rem', padding: '0.6rem' }}>
                      동기화 로그아웃
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={() => setIsAuthOpen(true)} style={{ width: '100%', fontSize: '0.8125rem', padding: '0.6rem' }}>
                    동기화 로그인 / 가입
                  </button>
                )
              ) : (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setIsCloudSettingsOpen(true)} 
                  style={{ width: '100%', borderStyle: 'dashed', justifyContent: 'center', fontSize: '0.8125rem', padding: '0.6rem' }}
                >
                  서버 연동 설정
                </button>
              )}
            </div>

            <h3 style={{ fontFamily: 'var(--font-logo)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>데이터 보관함</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              내 기기에 저장된 프롬프트 데이터를 내보내거나 가져옵니다.
            </p>
            
            <div className="settings-section">
              <div className="settings-row">
                <button 
                  className="btn btn-secondary flex-grow"
                  onClick={handleExport}
                >
                  <Download size={16} />
                  <span>레시피 백업하기</span>
                </button>
                <button 
                  className="btn btn-secondary flex-grow"
                  onClick={() => mobileFileInputRef.current?.click()}
                >
                  <Upload size={16} />
                  <span>레시피 불러오기</span>
                </button>
                <input 
                  type="file" 
                  ref={mobileFileInputRef} 
                  style={{ display: 'none' }} 
                  accept=".json"
                  onChange={handleMobileImportChange}
                />
              </div>

              <button 
                className="btn btn-danger" 
                onClick={handleResetDB}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                <Trash2 size={16} />
                <span>기기 데이터 전체 삭제</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => { setActiveTab('home'); }}
        >
          <Home size={18} />
          <span>홈 피드</span>
        </button>
        
        <button
          className="mobile-nav-item center-add"
          onClick={handleAddClick}
          title="레시피 추가"
        >
          <Plus size={22} style={{ strokeWidth: 3 }} />
        </button>
        
        <button
          className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => { setActiveTab('settings'); }}
        >
          <Settings size={18} />
          <span>설정</span>
        </button>
      </nav>

      {/* Modals */}
      {isFormOpen && (
        <PromptForm
          promptData={editingPrompt}
          prefilledImage={prefilledImage}
          onSave={handleSavePrompt}
          onClose={() => {
            setIsFormOpen(false);
            setEditingPrompt(null);
            setPrefilledImage('');
          }}
        />
      )}

      {selectedPrompt && (
        <PromptDetailModal
          prompt={selectedPrompt}
          onClose={() => setSelectedPrompt(null)}
          onCopy={handleCopyPrompt}
          onEdit={(prompt) => {
            setSelectedPrompt(null);
            handleEditClick(prompt);
          }}
          onDelete={handleDeletePrompt}
        />
      )}

      {/* Served/Action Toast message */}
      {toast.show && (
        <div className="toast">
          <Check size={14} style={{ color: 'var(--accent-green)' }} />
          <span>{toast.message}</span>
        </div>
      )}

      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {isCloudSettingsOpen && (
        <CloudSettingsModal
          onClose={() => setIsCloudSettingsOpen(false)}
          onSave={async () => {
            setIsCloudSettingsOpen(false);
            const { isConfigured } = getSupabaseConfig();
            setIsCloudConfigured(isConfigured);
            let newUser = null;
            if (isConfigured) {
              const client = getSupabaseClient();
              if (client) {
                try {
                  const { data: { session } } = await client.auth.getSession();
                  newUser = session?.user || null;
                  setUser(newUser);
                } catch (e) {
                  console.error(e);
                }
              }
            } else {
              setUser(null);
            }
            loadPrompts(newUser);
          }}
        />
      )}
    </div>
  );
}
