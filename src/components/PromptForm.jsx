import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Clipboard, Check, Plus, AlertCircle, Cookie } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

// Helper function to auto-detect title and tags from pasted prompt text
const analyzePromptText = (text) => {
  if (!text) return { autoTitle: '', autoTags: '' };
  
  // Remove brackets [variables], double-dash parameters, and punctuation
  let cleanText = text.replace(/\[.*?\]/g, ' ');
  cleanText = cleanText.replace(/--\w+\s+\S+/g, ' ');
  cleanText = cleanText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ');
  
  const tokens = cleanText.match(/[\w가-힣]+/g);
  if (!tokens) return { autoTitle: '', autoTags: '' };
  
  const stopwords = new Set([
    // English stopwords and common design prompt keywords
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on', 'at', 'for', 'by', 'with', 'from', 'about', 
    'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'up', 'down', 'niji', 'ar', 'v', 'stylize', 'chaos', 'quality', 
    'raw', 'rendering', 'render', 'detailed', 'illustration', 'aesthetic', 'photo', 'photography', 'hyperrealistic', 'photorealistic', 
    'realistic', '4k', '8k', '3d', 'style', 'anime', 'character', 'concept', 'art', 'digital', 'octane', 'engine', 'highly', 
    'wearing', 'background', 'wallpaper', 'trending', 'dribbble', 'artstation', 'masterpiece',
    // Korean stopwords
    '매우', '상세한', '초고화질', '고화질', '스타일', '그림', '사진', '일러스트'
  ]);
  
  const wordCounts = {};
  
  tokens.forEach(token => {
    let word = token.toLowerCase();
    
    // Korean particle remover
    if (/[가-힣]/.test(word)) {
      word = word.replace(/(의|은|는|이|가|을|를|에|에서|와|과|로|으로|하고|이고|이랑|이며|이다|하며)$/, '');
    }
    
    if (word.length < 2) return;
    if (stopwords.has(word)) return;
    if (/^\d+$/.test(word)) return; // ignore numbers
    
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Sort words by frequency desc, then length desc (prioritize descriptive terms)
  const sortedWords = Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.word.length - a.word.length;
    })
    .map(item => item.word);
    
  if (sortedWords.length === 0) {
    return { autoTitle: '새로운 레시피', autoTags: '' };
  }
  
  const capitalize = (str) => {
    if (!str) return '';
    if (/[가-힣]/.test(str)) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  
  // Title: top 2 words
  const titleWords = sortedWords.slice(0, Math.min(2, sortedWords.length));
  const autoTitle = titleWords.map(capitalize).join(' ');
  
  // Tags: top 4 words
  const tagWords = sortedWords.slice(0, Math.min(4, sortedWords.length));
  const autoTags = tagWords.join(', ');
  
  return { autoTitle, autoTags };
};

export default function PromptForm({
  promptData = null,
  prefilledImage = '',
  onSave,
  onClose
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [promptText, setPromptText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [imageSrc, setImageSrc] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (promptData) {
      setTitle(promptData.title || '');
      setCategory(promptData.category || '');
      setPromptText(promptData.promptText || '');
      setTagsInput(promptData.tags ? promptData.tags.join(', ') : '');
      setImageSrc(promptData.compressedImage || '');
    } else {
      setTitle('');
      setCategory('일반');
      setPromptText('');
      setTagsInput('');
      setImageSrc(prefilledImage || '');
    }
  }, [promptData, prefilledImage]);

  const autoFillFromText = (text) => {
    if (!text) return;
    const { autoTitle, autoTags } = analyzePromptText(text);
    
    // Only fill if current fields are empty to prevent overwriting user edits
    if (!title.trim()) {
      setTitle(autoTitle);
    }
    if (!tagsInput.trim()) {
      setTagsInput(autoTags);
    }
  };

  // Global paste handler
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageCompression(file);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);

  const handleImageCompression = async (file) => {
    setIsCompressing(true);
    try {
      const compressedData = await compressImage(file, 800, 1200, 0.7);
      setImageSrc(compressedData);
    } catch (err) {
      console.error(err);
      alert('이미지 압축에 실패했습니다: ' + err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageCompression(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageCompression(file);
    }
  };

  const handlePasteImageFromClipboard = async (e) => {
    e.stopPropagation();
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        throw new Error('Clipboard read not supported');
      }
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], 'clipboard-image.jpg', { type });
            handleImageCompression(file);
            return;
          }
        }
      }
      alert('클립보드에 복사된 이미지가 없습니다! 이미지 파일이나 스크린샷을 복사(Cmd+C)한 뒤 눌러주세요.');
    } catch (err) {
      console.error(err);
      alert(
        '보안 정책으로 인해 클립보드 접근 권한이 거부되었거나 지원되지 않는 브라우저입니다. 화면 아무 곳에서나 단축키(Cmd+V 또는 Ctrl+V)를 사용해 붙여넣어 주세요!'
      );
    }
  };

  const handlePasteTextToPrompt = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        throw new Error('Clipboard readText not supported');
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        setPromptText(prev => {
          const newText = prev ? prev + ' ' + text : text;
          autoFillFromText(newText);
          return newText;
        });
      } else {
        alert('클립보드에 복사된 텍스트가 없습니다.');
      }
    } catch (err) {
      console.error('클립보드 텍스트 읽기 오류: ', err);
      alert(
        '보안 정책으로 인해 클립보드 읽기 권한이 거부되었거나 지원되지 않는 브라우저입니다. 프롬프트 입력칸을 클릭하고 단축키(Cmd+V 또는 Ctrl+V)를 사용해 붙여넣어 주세요!'
      );
    }
  };

  const handleTextareaPaste = (e) => {
    // Prevent default browser paste behavior to avoid react controlled component state overrides
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const originalText = promptText || '';
      const newText = originalText.substring(0, start) + pastedText + originalText.substring(end);
      
      setPromptText(newText);
      autoFillFromText(pastedText);

      // Restore cursor position inside the textarea
      const target = e.target;
      setTimeout(() => {
        target.focus();
        target.selectionStart = target.selectionEnd = start + pastedText.length;
      }, 0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('레시피 제목을 입력해주세요.');
      return;
    }
    if (!promptText.trim()) {
      alert('프롬프트 내용을 입력해주세요.');
      return;
    }

    const finalCategory = promptData?.category || '일반';
    
    const tags = tagsInput
      .split(/[,,;]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const savedData = {
      id: promptData?.id || Date.now().toString(),
      title: title.trim(),
      category: finalCategory,
      promptText: promptText.trim(),
      tags,
      compressedImage: imageSrc,
      usageCount: promptData?.usageCount || 0,
      createdAt: promptData?.createdAt || new Date().toISOString()
    };

    onSave(savedData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel form-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="modal-header">
          <h2>
            <Cookie size={20} style={{ color: 'var(--accent-orange)' }} />
            <span>{promptData ? '레시피 수정하기' : '새로운 레시피 굽기'}</span>
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>참고 스크린샷 이미지 (저용량 자동 압축)</label>
              
              {imageSrc ? (
                <div className="preview-container">
                  <div className="preview-scroll-wrapper">
                    <img src={imageSrc} alt="Preview" className="preview-image" />
                  </div>
                  <button 
                    type="button" 
                    className="remove-preview-btn" 
                    onClick={() => setImageSrc('')}
                  >
                    이미지 삭제
                  </button>
                </div>
              ) : (
                <div 
                  className={`image-upload-zone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-icon-box">
                    <Upload size={20} />
                  </div>
                  <div className="upload-text">
                    {isCompressing ? (
                      <span style={{ color: 'var(--accent-orange)', fontWeight: 700 }}>이미지 반죽하는 중...</span>
                    ) : (
                      <>
                        여기로 이미지를 드래그하거나 <span>클릭하여 업로드</span><br />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          앱 화면 어디서나 Cmd+V (Ctrl+V)를 눌러 바로 붙여넣을 수도 있어요!
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="upload-actions-row">
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon-only"
                      onClick={handlePasteImageFromClipboard}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      <Clipboard size={12} style={{ color: 'var(--accent-orange)' }} />
                      <span>클립보드 이미지 붙여넣기</span>
                    </button>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="title">레시피 이름 (제목)</label>
              <input
                id="title"
                type="text"
                className="input-text"
                placeholder="예: 실사풍 사이버펑크 캐릭터"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="promptText">프롬프트 재료 (템플릿)</label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.725rem', borderRadius: '99px' }}
                  onClick={handlePasteTextToPrompt}
                >
                  <Clipboard size={10} />
                  <span>텍스트 붙여넣기</span>
                </button>
              </div>
              <textarea
                id="promptText"
                className="input-text input-textarea"
                placeholder="예: A cinematic portrait of a [subject] wearing [clothing], neon light [color] theme --ar 16:9"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onPaste={handleTextareaPaste}
                required
              />
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={10} style={{ color: 'var(--accent-orange)' }} />
                대괄호 <strong>[변수명]</strong>을 입력하면 복사할 때 원하는 내용을 넣을 수 있는 칸이 생겨요!
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="tags">토핑 추가 (태그, 쉼표나 띄어쓰기로 구분)</label>
              <input
                id="tags"
                type="text"
                className="input-text"
                placeholder="예: cyberpunk, portrait, neon"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={isCompressing}>
              {isCompressing ? '반죽하는 중...' : '레시피 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
