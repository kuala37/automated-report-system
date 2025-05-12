import React from 'react';
import { ElementStyle } from '../../types/formatting';

interface StylePreviewProps {
  style: ElementStyle;
  text: string;
  borderOnly?: boolean;
}

const StylePreview: React.FC<StylePreviewProps> = ({ style, text, borderOnly = false }) => {
  const previewStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    color: style.fontColor,
    backgroundColor: style.backgroundColor,
    fontWeight: style.fontStyle?.bold ? 'bold' : 'normal',
    fontStyle: style.fontStyle?.italic ? 'italic' : 'normal',
    textDecoration: [
      style.fontStyle?.underline ? 'underline' : '',
      style.fontStyle?.strikethrough ? 'line-through' : ''
    ].filter(Boolean).join(' '),
    textAlign: style.alignment,
    lineHeight: style.lineSpacing ? `${style.lineSpacing * 1.2}em` : 'normal',
    marginBottom: style.paragraphSpacing ? `${style.paragraphSpacing}px` : 'initial',
    textIndent: style.indent ? `${style.indent}px` : 'initial',
    padding: '1rem',
    whiteSpace: 'pre-line',
    border: borderOnly || style.borderStyle !== 'none' ? 
      `${style.borderWidth || 1}px ${style.borderStyle || 'solid'} ${style.borderColor || '#000'}` : 
      'none',
  };

  if (borderOnly) {
    return (
      <div className="mt-4 border p-4">
        <div style={{ border: `${style.borderWidth || 1}px ${style.borderStyle || 'solid'} ${style.borderColor || '#000'}`, padding: '1rem' }}>
          Пример границы таблицы
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 border p-4 rounded-lg">
      <h3 className="text-sm font-medium mb-2">Предпросмотр</h3>
      <div style={previewStyle}>
        {text}
      </div>
    </div>
  );
};

export default StylePreview;
