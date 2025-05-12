import React from 'react';
import { DocumentStyles } from '../../types/formatting';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface StyleDiagramProps {
  styles: DocumentStyles;
}

const StyleDiagram: React.FC<StyleDiagramProps> = ({ styles }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Структура документа</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="aspect-[1/1.414] border relative bg-white" 
          style={{ 
            width: '100%',
            maxWidth: '400px',
            margin: '0 auto'
          }}
        >
          {/* Визуализация полей */}
          <div 
            className="absolute inset-0 border-2 border-dashed border-blue-200"
            style={{
              margin: `${styles.pageSetup.margins.top}px ${styles.pageSetup.margins.right}px ${styles.pageSetup.margins.bottom}px ${styles.pageSetup.margins.left}px`,
            }}
          >
            {/* Пример заголовка */}
            <div 
              className="w-full h-8 mb-3 bg-blue-100 rounded"
              style={{
                fontFamily: styles.headings.h1?.fontFamily,
                fontSize: styles.headings.h1?.fontSize ? `${styles.headings.h1.fontSize / 4}px` : '10px',
                backgroundColor: styles.headings.h1?.backgroundColor || 'rgba(59, 130, 246, 0.1)',
              }}
            />
            
            {/* Пример заголовка 2 уровня */}
            <div 
              className="w-full h-6 mb-2 bg-blue-50 rounded"
              style={{
                fontFamily: styles.headings.h2?.fontFamily,
                fontSize: styles.headings.h2?.fontSize ? `${styles.headings.h2.fontSize / 5}px` : '8px',
                backgroundColor: styles.headings.h2?.backgroundColor || 'rgba(59, 130, 246, 0.05)',
              }}
            />
            
            {/* Параграфы */}
            <div className="flex flex-col gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div 
                  key={i}
                  className="w-full h-3 bg-gray-100 rounded"
                  style={{
                    backgroundColor: styles.paragraphs?.backgroundColor || 'rgba(229, 231, 235, 0.5)',
                  }}
                />
              ))}
            </div>
            
            {/* Список */}
            <div className="mt-3 ml-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <div className="h-2 w-2 rounded-full bg-gray-400" />
                  <div 
                    className="w-3/4 h-3 bg-gray-100 rounded"
                    style={{
                      backgroundColor: styles.lists.bullet?.backgroundColor || 'rgba(229, 231, 235, 0.5)',
                    }}
                  />
                </div>
              ))}
            </div>
            
            {/* Заголовок 2 уровня */}
            <div 
              className="w-full h-6 mt-4 mb-2 bg-blue-50 rounded"
              style={{
                fontFamily: styles.headings.h2?.fontFamily,
                fontSize: styles.headings.h2?.fontSize ? `${styles.headings.h2.fontSize / 5}px` : '8px',
                backgroundColor: styles.headings.h2?.backgroundColor || 'rgba(59, 130, 246, 0.05)',
              }}
            />
            
            {/* Таблица */}
            <div className="border border-gray-300 mt-3">
              <div 
                className="w-full h-5 bg-gray-200 border-b border-gray-300"
                style={{
                  backgroundColor: styles.tables.header?.backgroundColor || 'rgba(229, 231, 235, 0.8)',
                }}
              >
                <div className="flex h-full">
                  <div className="flex-1 border-r border-gray-300"></div>
                  <div className="flex-1 border-r border-gray-300"></div>
                  <div className="flex-1"></div>
                </div>
              </div>
              <div className="w-full">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="h-4 flex border-b border-gray-300"
                    style={{
                      backgroundColor: styles.tables.cells?.backgroundColor || 'rgba(255, 255, 255)',
                    }}
                  >
                    <div className="flex-1 border-r border-gray-300"></div>
                    <div className="flex-1 border-r border-gray-300"></div>
                    <div className="flex-1"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Обозначения размера страницы */}
          <div className="absolute -top-6 left-0 right-0 text-center text-xs text-gray-500">
            {styles.pageSetup.pageSize} ({styles.pageSetup.orientation})
          </div>
          
          {/* Обозначения полей */}
          <div className="absolute -left-6 top-0 bottom-0 flex items-center justify-center text-xs text-gray-500 rotate-90">
            Поля: В:{styles.pageSetup.margins.top} Н:{styles.pageSetup.margins.bottom} Л:{styles.pageSetup.margins.left} П:{styles.pageSetup.margins.right} (мм)
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StyleDiagram;
