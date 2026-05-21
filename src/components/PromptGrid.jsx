import React, { useState } from 'react';
import { Copy, Check, Edit3, Trash2, Sparkles } from 'lucide-react';

function PromptCard({ prompt, onCopy, onEdit, onDelete, onClick }) {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.promptText);
    onCopy(prompt.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article className="prompt-card glass-panel">
      <div className="card-image-container" onClick={onClick} style={{ cursor: 'pointer' }}>
        {prompt.compressedImage ? (
          <img 
            src={prompt.compressedImage} 
            alt={prompt.title} 
            className="card-image" 
            loading="lazy"
          />
        ) : (
          <div className="card-image" style={{
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.8125rem',
            fontStyle: 'italic',
            fontWeight: 600
          }}>
            참고 이미지 없음
          </div>
        )}
        
        <div className="card-actions-top">
          <button 
            className="card-btn" 
            onClick={(e) => { e.stopPropagation(); onEdit(prompt); }}
            title="레시피 수정"
          >
            <Edit3 size={14} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button 
            className="card-btn delete" 
            onClick={(e) => { e.stopPropagation(); onDelete(prompt.id); }}
            title="레시피 삭제"
          >
            <Trash2 size={14} />
          </button>
        </div>
        
        <div className="card-overlay">
          <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
            <Sparkles size={12} style={{ color: 'var(--accent-yellow)' }} />
            <span>상세 보기 및 변수 편집</span>
          </div>
        </div>
      </div>

      <div className="card-content">
        <h3 className="card-title" onClick={onClick}>{prompt.title}</h3>
        <p className="card-prompt-preview" onClick={onClick} style={{ cursor: 'pointer' }}>
          {prompt.promptText}
        </p>

        <div className="card-footer">
          <div className="card-tags">
            {prompt.tags && prompt.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="card-tag">#{tag}</span>
            ))}
            {prompt.tags && prompt.tags.length > 3 && (
              <span className="card-tag">+{prompt.tags.length - 3}</span>
            )}
          </div>

          <button 
            className={`card-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopyClick}
            style={{ 
              backgroundColor: copied ? 'var(--accent-green)' : '',
              color: copied ? 'white' : '',
              borderColor: copied ? 'var(--accent-green)' : ''
            }}
          >
            {copied ? (
              <>
                <Check size={12} />
                <span>복사완료!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>복사</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function PromptGrid({ prompts, onCopy, onEdit, onDelete, onSelectPrompt }) {
  if (prompts.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Sparkles size={28} style={{ color: 'var(--accent-orange)' }} />
        </div>
        <h3>보관 중인 레시피가 없습니다</h3>
        <p>
          이 카테고리에 저장된 프롬프트가 없거나 검색 결과가 없습니다. 상단 우측(모바일은 하단 가운데)의 '+' 버튼을 눌러 맛있는 프롬프트를 구워보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="prompt-grid">
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onCopy={onCopy}
          onEdit={onEdit}
          onDelete={onDelete}
          onClick={() => onSelectPrompt(prompt)}
        />
      ))}
    </div>
  );
}
