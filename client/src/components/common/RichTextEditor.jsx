import React, { useRef } from 'react';
import { Bold, Italic, Heading, List, Link as LinkIcon } from 'lucide-react';

const RichTextEditor = ({ value, onChange, placeholder, minHeight = '200px' }) => {
  const textareaRef = useRef(null);

  const applyFormat = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleBold = () => applyFormat('**', '**');
  const handleItalic = () => applyFormat('*', '*');
  const handleHeading = () => applyFormat('\n### ');
  const handleList = () => applyFormat('\n- ');
  const handleLink = () => {
    const url = prompt('Enter URL link:');
    if (url) {
      applyFormat('[', `](${url})`);
    }
  };

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.4rem 0.6rem',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <button type="button" onClick={handleBold} title="Bold" style={{ padding: '0.3rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
          <Bold size={16} />
        </button>
        <button type="button" onClick={handleItalic} title="Italic" style={{ padding: '0.3rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
          <Italic size={16} />
        </button>
        <button type="button" onClick={handleHeading} title="Heading" style={{ padding: '0.3rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
          <Heading size={16} />
        </button>
        <button type="button" onClick={handleList} title="Bullet List" style={{ padding: '0.3rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
          <List size={16} />
        </button>
        <button type="button" onClick={handleLink} title="Add Link" style={{ padding: '0.3rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
          <LinkIcon size={16} />
        </button>
      </div>

      {/* Input Text Area */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight: minHeight,
          border: 'none',
          borderRadius: '0',
          padding: '0.75rem',
          resize: 'vertical',
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          fontSize: '0.925rem',
          lineHeight: '1.6'
        }}
      />
    </div>
  );
};

export default RichTextEditor;
