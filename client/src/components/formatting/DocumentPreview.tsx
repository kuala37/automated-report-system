import React from 'react';
import { FormattingPreset, DocumentStyles } from '../../types/formatting';

interface DocumentPreviewProps {
  title: string;
  sections: Array<{ title: string; content: string; heading_level: number }>;
  styles: DocumentStyles;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ title, sections, styles }) => {
  const getHeadingStyle = (level: number) => {
    const styleKey = `h${level}` as keyof DocumentStyles['headings'];
    return styles.headings[styleKey] || {};
  };

  const renderHeading = (text: string, level: number) => {
    const style = getHeadingStyle(level);
    const styleProps: React.CSSProperties = {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
      color: style.fontColor,
      fontWeight: style.fontStyle?.bold ? 'bold' : 'normal',
      fontStyle: style.fontStyle?.italic ? 'italic' : 'normal',
      textDecoration: [
        style.fontStyle?.underline ? 'underline' : '',
        style.fontStyle?.strikethrough ? 'line-through' : ''
      ].filter(Boolean).join(' '),
      textAlign: style.alignment,
      marginBottom: style.paragraphSpacing ? `${style.paragraphSpacing}px` : undefined,
      backgroundColor: style.backgroundColor,
    };

    switch (level) {
      case 1: return <h1 style={styleProps}>{text}</h1>;
      case 2: return <h2 style={styleProps}>{text}</h2>;
      case 3: return <h3 style={styleProps}>{text}</h3>;
      case 4: return <h4 style={styleProps}>{text}</h4>;
      case 5: return <h5 style={styleProps}>{text}</h5>;
      case 6: return <h6 style={styleProps}>{text}</h6>;
      default: return <h1 style={styleProps}>{text}</h1>;
    }
  };

  const renderParagraph = (text: string) => {
    const style = styles.paragraphs;
    const styleProps: React.CSSProperties = {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
      color: style.fontColor,
      fontWeight: style.fontStyle?.bold ? 'bold' : 'normal',
      fontStyle: style.fontStyle?.italic ? 'italic' : 'normal',
      textDecoration: [
        style.fontStyle?.underline ? 'underline' : '',
        style.fontStyle?.strikethrough ? 'line-through' : ''
      ].filter(Boolean).join(' '),
      textAlign: style.alignment,
      lineHeight: style.lineSpacing ? `${style.lineSpacing * 1.2}em` : undefined,
      marginBottom: style.paragraphSpacing ? `${style.paragraphSpacing}px` : undefined,
      textIndent: style.indent ? `${style.indent}px` : undefined,
      backgroundColor: style.backgroundColor,
    };

    return <p style={styleProps}>{text}</p>;
  };

  const simulateContent = (content: string) => {
    // Если контент недоступен (в случае с запросами) - создаем случайный текст для наглядности
    if (!content || content.trim() === '') {
      return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ut ipsum quis nisi varius pulvinar. Donec sed aliquet lacus. Morbi in ultrices lectus. Etiam non diam vitae neque finibus mattis vitae et odio.';
    }
    return content;
  };

  return (
    <div className="border rounded-lg p-4 bg-background">
      <div
        style={{
          padding: '30px',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          maxWidth: '800px',
          margin: '0 auto',
          aspectRatio: styles.pageSetup.orientation === 'portrait' ? '1/1.414' : '1.414/1',
        }}
      >
        {renderHeading(title, 1)}
        
        {sections.map((section, index) => (
          <div key={index}>
            {renderHeading(section.title, section.heading_level)}
            {renderParagraph(simulateContent(section.content))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentPreview;
