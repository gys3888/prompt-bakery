import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Calendar, Sparkles, Edit3, Trash2 } from 'lucide-react';

export default function PromptDetailModal({ prompt, onClose, onCopy, onEdit, onDelete }) {
  const [variables, setVariables] = useState([]);
  const [varValues, setVarValues] = useState({});
  const [copiedCompiled, setCopiedCompiled] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  useEffect(() => {
    if (prompt && prompt.promptText) {
      const regex = /\[(.*?)\]/g;
      const matches = [...prompt.promptText.matchAll(regex)];
      const uniqueVars = Array.from(new Set(matches.map(m => m[1].trim())));
      setVariables(uniqueVars);
      
      const initialValues = {};
      uniqueVars.forEach(v => {
        initialValues[v] = '';
      });
      setVarValues(initialValues);
    }
  }, [prompt]);

  if (!prompt) return null;

  const handleVarChange = (varName, value) => {
    setVarValues(prev => ({
      ...prev,
      [varName]: value
    }));
  };

  const getCompiledText = () => {
    return prompt.promptText.replace(/\[(.*?)\]/g, (match, varName) => {
      const trimmed = varName.trim();
      return varValues[trimmed] || match;
    });
  };

  const handleCopyCompiled = () => {
    const text = getCompiledText();
    navigator.clipboard.writeText(text);
    onCopy(prompt.id);
    setCopiedCompiled(true);
    setTimeout(() => setCopiedCompiled(false), 1500);
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(prompt.promptText);
    onCopy(prompt.id);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 1500);
  };

  const renderPromptPreview = () => {
    const text = prompt.promptText;
    const parts = [];
    let lastIndex = 0;
    const regex = /\[(.*?)\]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const varName = match[1].trim();
      const varValue = varValues[varName];

      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      parts.push(
        <span 
          key={match.index} 
          className="highlight-var"
          style={{
            background: varValue ? 'var(--accent-yellow-glow)' : 'rgba(244, 63, 94, 0.12)',
            borderBottom: varValue ? '2px solid var(--accent-yellow)' : '2px dashed var(--accent-rose)',
            color: 'var(--text-primary)'
          }}
        >
          {varValue || `[${varName}]`}
        </span>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-actions-top">
          {onEdit && (
            <button 
              className="modal-action-btn" 
              onClick={() => onEdit(prompt)}
              title="레시피 수정"
            >
              <Edit3 size={16} />
            </button>
          )}
          {onDelete && (
            <button 
              className="modal-action-btn delete" 
              onClick={() => onDelete(prompt.id)}
              title="레시피 삭제"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button className="modal-action-btn close" onClick={onClose} title="닫기">
            <X size={18} />
          </button>
        </div>

        <div className="detail-modal-layout">
          {/* Visual Side */}
          <div className="detail-visual-side">
            <div className="detail-image-box">
              {prompt.compressedImage ? (
                <img src={prompt.compressedImage} alt={prompt.title} />
              ) : (
                <div style={{
                  padding: '4rem 2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  height: '100%',
                  background: 'var(--bg-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  fontStyle: 'italic'
                }}>
                  등록된 참고 스크린샷이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* Info & Variables Side */}
          <div className="detail-info-side">
            <div className="detail-header">
              <h2 className="detail-title">{prompt.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                <Calendar size={12} />
                <span>저장일: {formatDate(prompt.createdAt)}</span>
                <span>•</span>
                <span>복사 횟수: {prompt.usageCount || 0}회</span>
              </div>
            </div>

            {prompt.tags && prompt.tags.length > 0 && (
              <div className="detail-tags">
                {prompt.tags.map((tag, idx) => (
                  <span key={idx} className="detail-tag">#{tag}</span>
                ))}
              </div>
            )}

            {/* Custom variable inputs if any exist */}
            {variables.length > 0 && (
              <div className="detail-variables-section">
                <div className="variables-title">
                  <Sparkles size={14} style={{ color: 'var(--accent-orange)' }} />
                  <span>레시피 재료 채우기 (변수 설정)</span>
                </div>
                <div className="variables-grid">
                  {variables.map((v) => (
                    <div key={v} className="variable-row">
                      <label className="variable-label" title={v}>{v}</label>
                      <input
                        type="text"
                        className="input-text"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px' }}
                        placeholder={`${v} 내용을 적어주세요...`}
                        value={varValues[v] || ''}
                        onChange={(e) => handleVarChange(v, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Prompt Preview Display */}
            <div className="detail-prompt-box">
              <span className="prompt-box-title">완성된 프롬프트 미리보기</span>
              <div className="prompt-text-display">
                {renderPromptPreview()}
              </div>
            </div>

            <div className="actions-footer">
              <button 
                className="btn btn-secondary" 
                onClick={handleCopyRaw}
                style={{ 
                  backgroundColor: copiedRaw ? 'var(--accent-green)' : '',
                  color: copiedRaw ? 'white' : '',
                  borderColor: copiedRaw ? 'var(--accent-green)' : ''
                }}
              >
                {copiedRaw ? (
                  <>
                    <Check size={16} />
                    <span>템플릿 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>원래 템플릿 복사</span>
                  </>
                )}
              </button>

              <button 
                className="btn btn-primary" 
                onClick={handleCopyCompiled}
                style={{ 
                  background: copiedCompiled ? 'var(--accent-green)' : '',
                  borderColor: copiedCompiled ? 'var(--accent-green)' : '',
                  boxShadow: copiedCompiled ? '0 2px 10px rgba(46, 204, 113, 0.4)' : ''
                }}
              >
                {copiedCompiled ? (
                  <>
                    <Check size={16} />
                    <span>완성본 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>완성본 복사하기</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
