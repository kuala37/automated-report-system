import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/ui';
import { useToast } from '../utils/toast';
import { reports, reportEditor } from '../api/ApiClient';
import ChatWindow from '../components/chat/ChatWindowForEdit';
import { ArrowLeft, Loader2, Save, Type, X, History, RotateCcw, ChevronDown } from 'lucide-react';

interface Report {
  id: number;
  title: string;
  file_path: string;
  chat_id: number;
  document_version: number;
  version_history?: Array<{
    version: number;
    timestamp: string;
    description: string;
    edit_description?: string;
    has_html?: boolean;
    has_file?: boolean;
  }>;
}

const ReportEditorPage = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [chatId, setChatId] = useState<number | null>(null);
  const [documentHtml, setDocumentHtml] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectedParagraphId, setSelectedParagraphId] = useState<number | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isLoadingRef = useRef(false); 
  const didInitialLoad = useRef(false);
  const [showSelectedText, setShowSelectedText] = useState<boolean>(true);
  
  // Состояния для версий
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [isLoadingVersion, setIsLoadingVersion] = useState<boolean>(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState<boolean>(false);

  // Мемоизированные вычисления для предотвращения пересчета при каждом рендере
  const { isCurrentVersion, versionHistory, allVersions, sortedVersions, maxHistoryVersion } = useMemo(() => {
    const versionHistory = report?.version_history || [];
    const isCurrentVersion = currentVersion === report?.document_version;
    
    // Генерируем список всех версий для выпадающего списка
    const allVersions = [];
    if (report && report.document_version) {
      // Создаем полный список версий от 1 до максимальной
      for (let i = 1; i <= report.document_version; i++) {
        const versionData = versionHistory.find(v => v.version === i);
        
        // Добавляем версию в список, даже если её нет в истории
        allVersions.push({
          version: i,
          description: versionData?.description || `Версия ${i}`,
          edit_description: versionData?.edit_description || (i === report.document_version ? 'Текущая версия' : 'Недостающая запись'),
          timestamp: versionData?.timestamp || '',
          exists_in_history: !!versionData
        });
      }
    }

    // Создаем отсортированную копию для отображения (от новых к старым)
    const sortedVersions = [...allVersions].sort((a, b) => b.version - a.version);
    
    const maxHistoryVersion = versionHistory.length > 0 
      ? Math.max(...versionHistory.map(v => v.version)) 
      : 'none';

    return {
      isCurrentVersion,
      versionHistory,
      allVersions,
      sortedVersions,
      maxHistoryVersion
    };
  }, [report, currentVersion]);

  // Отладочные логи только при изменении ключевых данных
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Debug info (data changed):', {
        reportId: report?.id,
        reportTitle: report?.title,
        documentVersion: report?.document_version,
        currentVersion,
        historyLength: versionHistory.length,
        totalVersions: allVersions.length,
        maxHistoryVersion
      });
    }
  }, [report?.id, report?.document_version, currentVersion, versionHistory.length, allVersions.length, maxHistoryVersion]);

  useEffect(() => {
    if (reportId && !didInitialLoad.current) {
      didInitialLoad.current = true;
      loadReport(parseInt(reportId));
    }
  }, [reportId]);

  const loadReport = async (id: number) => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;

      // Загружаем данные отчета
      const reportData = await reports.getById(id);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Loaded report data:', reportData);
      }
      
      // Загружаем историю версий отдельно
      const versionHistoryData = await reportEditor.getVersionHistory(id);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Loaded version history:', versionHistoryData);
      }
      
      // Определяем текущую версию документа из истории версий
      const currentDocumentVersion = versionHistoryData.current_version || reportData.document_version || 1;
      
      // Обновляем состояние отчета с корректными данными
      setReport({
        ...reportData,
        document_version: currentDocumentVersion,
        version_history: versionHistoryData.history || []
      });
      
      // Устанавливаем текущую версию для просмотра (по умолчанию - последняя)
      setCurrentVersion(currentDocumentVersion);
      
      // Если у отчета уже есть связанный чат, используем его
      if (reportData.chat_id) {
        setChatId(reportData.chat_id);
      } else {
        // Иначе - создаем новый чат для отчета
        const chatData = await reportEditor.generateReportChat(id);
        setChatId(chatData.chat_id);
      }

      // Загружаем HTML-представление текущей версии документа
      await loadDocumentVersion(id, currentDocumentVersion);
      
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report data',
        variant: 'destructive',
      });
    } finally {
      isLoadingRef.current = false;
    }
  };

  const loadDocumentVersion = async (reportId: number, version: number) => {
    setIsLoadingVersion(true);
    try {
      const htmlData = await reportEditor.getReportHtml(reportId, version);
      setDocumentHtml(htmlData.html);
      setCurrentVersion(version);
    } catch (error) {
      console.error('Error loading document version:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить версию документа',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingVersion(false);
    }
  };

  const switchToVersion = async (version: number) => {
    if (!reportId || version === currentVersion) return;
    await loadDocumentVersion(parseInt(reportId), version);
    clearSelectedText();
    setShowVersionDropdown(false);
  };

  const createNewVersion = async (description: string = '') => {
    if (!reportId || !report) return;

    try {
      const result = await reportEditor.createNewVersion(parseInt(reportId), description);
      if (result.success) {
        // Загружаем свежую историю версий
        const versionHistoryData = await reportEditor.getVersionHistory(parseInt(reportId));
        
        // Обновляем отчет с правильными данными версии
        setReport(prev => prev ? {
          ...prev,
          document_version: versionHistoryData.current_version,
          version_history: versionHistoryData.history || []
        } : prev);
        
        setCurrentVersion(versionHistoryData.current_version);
        
        // Загружаем новую версию
        await loadDocumentVersion(parseInt(reportId), versionHistoryData.current_version);
        
        toast({
          title: 'Успешно',
          description: 'Создана новая версия документа',
        });
      }
    } catch (error) {
      console.error('Error creating new version:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать новую версию',
        variant: 'destructive',
      });
    }
  };

  const restoreVersion = async (version: number) => {
    if (!reportId || !report) return;

    try {
      const result = await reportEditor.restoreVersion(parseInt(reportId), version);
      if (result.success) {
        // Загружаем свежую историю версий
        const versionHistoryData = await reportEditor.getVersionHistory(parseInt(reportId));
        
        // Обновляем отчет с правильными данными версии
        setReport(prev => prev ? {
          ...prev,
          document_version: versionHistoryData.current_version,
          version_history: versionHistoryData.history || []
        } : prev);
        
        setCurrentVersion(versionHistoryData.current_version);
        
        // Загружаем восстановленную версию
        await loadDocumentVersion(parseInt(reportId), versionHistoryData.current_version);
        
        toast({
          title: 'Успешно',
          description: result.message,
        });
        
        setShowVersionDropdown(false);
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось восстановить версию',
        variant: 'destructive',
      });
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedContent = range.toString().trim();
    
    if (selectedContent) {
      // Очищаем и нормализуем выделенный текст
      const normalizedText = selectedContent
        .replace(/\s+/g, ' ')  // Заменяем множественные пробелы на одинарные
        .trim();
        
      if (process.env.NODE_ENV === 'development') {
        console.log('Выделенный текст:', normalizedText);
        console.log('Длина выделенного текста:', normalizedText.length);
      }
      
      setSelectedText(normalizedText);
      
      // Находим ID параграфа (берем первый найденный)
      let node = range.startContainer;
      while (node && node.nodeType !== Node.ELEMENT_NODE) {
        node = node.parentNode as Node;
      }
      
      let paragraphId: number | null = null;
      if (node) {
        const element = node as HTMLElement;
        const paragraphIdAttr = element.dataset.paragraphId || 
                          element.closest('[data-paragraph-id]')?.getAttribute('data-paragraph-id');
                          
        if (paragraphIdAttr) {
          paragraphId = parseInt(paragraphIdAttr, 10);
          setSelectedParagraphId(paragraphId);
        } else {
          setSelectedParagraphId(null);
        }
      }

      setShowSelectedText(true);
    }
  };

  // Функция для очистки выделенного текста
  const clearSelectedText = () => {
    setSelectedText('');
    setSelectedParagraphId(null);
    
    // Очищаем выделение в браузере
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  };

  // Обработка команды от чата
  const handleChatCommand = async (command: string) => {
    if (!reportId || !chatId) return;

    // Проверяем, что мы редактируем текущую версию
    if (currentVersion !== report?.document_version) {
      toast({
        title: 'Предупреждение',
        description: 'Вы можете редактировать только текущую версию документа',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Формируем полную команду с учетом выделенного текста
      let fullCommand = command;
      
      if (selectedText) {
        // Экранируем кавычки в выделенном тексте
        const escapedText = selectedText.replace(/"/g, '\\"');
        
        const contextInfo = `[ВЫДЕЛЕННЫЙ ТЕКСТ: "${escapedText}"${
          selectedParagraphId !== null ? ` в параграфе ${selectedParagraphId}` : ''
        }] `;
        fullCommand = contextInfo + command;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Отправляемая команда:', fullCommand);
        }
      }
      
      const result = await reportEditor.processChatCommand(
        parseInt(reportId),
        chatId,
        { text: fullCommand }
      );
      
      if (result.success) {
        // Загружаем свежую историю версий вместо перезагрузки всего отчета
        const versionHistoryData = await reportEditor.getVersionHistory(parseInt(reportId));
        
        // Обновляем отчет с правильными данными версии
        setReport(prev => prev ? {
          ...prev,
          document_version: versionHistoryData.current_version,
          version_history: versionHistoryData.history || []
        } : prev);
        
        // Обновляем HTML-представление документа после успешного редактирования
        const updatedHtml = await reportEditor.getReportHtml(parseInt(reportId));
        setDocumentHtml(updatedHtml.html);
        setCurrentVersion(versionHistoryData.current_version);
        
        toast({
          title: 'Успешно',
          description: result.message,
        });
        
        // Очищаем текущее выделение после успешной команды
        clearSelectedText();
      } else {
        toast({
          title: 'Ошибка',
          description: result.message,
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error processing edit command:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обработать команду редактирования',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Добавим функцию для синхронизации стилей с Word документом
// const applWordDocumentStyles = () => {
//   if (documentRef.current) {
//     const viewer = documentRef.current;
    
//     // Применяем базовые стили Word документа
//     viewer.style.fontFamily = '"Times New Roman", Times, serif';
//     viewer.style.fontSize = '12pt';
//     viewer.style.lineHeight = '1.15';
//     viewer.style.color = '#000000';
//     viewer.style.backgroundColor = 'white';
//     viewer.style.padding = '2.54cm 1.91cm'; // Стандартные поля Word
//     viewer.style.maxWidth = '21cm'; // Ширина A4
//     viewer.style.minHeight = '29.7cm'; // Высота A4
//     viewer.style.margin = '0 auto';
//     viewer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
//     viewer.style.border = '1px solid #e0e0e0';
    
//     // Применяем правильные стили к параграфам
//     const paragraphs = viewer.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
//     paragraphs.forEach(p => {
//       const element = p as HTMLElement;
//       element.style.margin = '0';
//       element.style.padding = '0';
//       element.style.lineHeight = '1.15';
      
//       // Проверяем, есть ли уже inline стиль для text-indent
//       const hasIndentStyle = element.style.textIndent;
      
//       // Если нет inline стиля и это обычный параграф - применяем стандартный отступ
//       if (!hasIndentStyle && element.tagName.toLowerCase() === 'p') {
//         const classList = element.className.toLowerCase();
//         if (!classList.includes('heading') && !classList.includes('title')) {
//           element.style.textIndent = '1.25cm';
//         }
//       }
//     });
    
//     // Обрабатываем пустые параграфы
//     const emptyParagraphs = viewer.querySelectorAll('[data-is-empty="true"]');
//     emptyParagraphs.forEach(p => {
//       const element = p as HTMLElement;
//       element.style.height = '1.15em';
//       element.style.minHeight = '1.15em';
//     });
    
//     // Убираем отступ первой строки у заголовков
//     const headings = viewer.querySelectorAll('h1, h2, h3, h4, h5, h6');
//     headings.forEach(h => {
//       const element = h as HTMLElement;
//       element.style.textIndent = '0';
//     });
//   }
// };

//   // Применяем стили после загрузки документа
//   useEffect(() => {
//     if (documentHtml && documentRef.current) {
//       // Небольшая задержка для полной загрузки HTML
//       setTimeout(() => {
//         applWordDocumentStyles();
//       }, 100);
//     }
//   }, [documentHtml]);

  if (isLoadingRef.current || isLoadingVersion) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-lg">
            {isLoadingRef.current ? 'Загрузка отчета и подготовка редактора...' : 'Загрузка версии документа...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{report?.title || 'Редактор отчета'}</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate('/reports')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к отчетам
          </Button>
          <Button 
            onClick={() => {
              if (report) {
                reports.download(report.id, report.file_path.split('/').pop() || 'report.docx');
              }
            }}
            disabled={!report}
          >
            <Save className="mr-2 h-4 w-4" />
            Скачать документ
          </Button>
        </div>
      </div>

      {/* Упрощенная панель управления версиями */}
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Выпадающий список версий */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                className="flex items-center space-x-2"
              >
                <History className="h-4 w-4" />
                <span>v{currentVersion || report?.document_version || '?'}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
              
              {showVersionDropdown && (
                <div className="absolute top-full mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg min-w-[300px]">
                  <div className="max-h-60 overflow-y-auto">
                    {sortedVersions.length === 0 ? (
                      <div className="p-3 text-gray-500 text-center">
                        <p>Загрузка версий...</p>
                        <p className="text-xs mt-1">
                          История: {versionHistory.length} записей
                        </p>
                        <p className="text-xs mt-1">
                          Текущая версия: {currentVersion || report?.document_version || 'не установлена'}
                        </p>
                      </div>
                    ) : (
                      sortedVersions.map((version) => (
                        <div
                          key={version.version}
                          className={`p-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer ${
                            version.version === currentVersion ? 'bg-blue-50' : ''
                          } ${
                            !version.exists_in_history ? 'bg-gray-50' : ''
                          }`}
                          onClick={() => switchToVersion(version.version)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">v{version.version}</span>
                              {!version.exists_in_history && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                  Неполная запись
                                </span>
                              )}
                              {version.version === report?.document_version && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                  Текущая
                                </span>
                              )}
                              {version.version === currentVersion && version.version !== report?.document_version && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  Просматриваемая
                                </span>
                              )}
                            </div>
                            {version.version !== report?.document_version && version.exists_in_history && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  restoreVersion(version.version);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {version.edit_description && (
                            <p className={`text-xs mt-1 ${
                              !version.exists_in_history ? 'text-orange-600' : 'text-gray-600'
                            }`}>
                              {version.edit_description}
                            </p>
                          )}
                          {version.timestamp && version.exists_in_history && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(version.timestamp).toLocaleString()}
                            </p>
                          )}
                          {!version.exists_in_history && (
                            <p className="text-xs text-orange-500 mt-1">
                              Версия существует, но данные отсутствуют в истории
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Отладочная информация (только в режиме разработки) */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="p-2 bg-gray-50 border-t text-xs text-gray-500">
                      <div>Отладка:</div>
                      <div>• Всего версий: {allVersions.length}</div>
                      <div>• В истории: {versionHistory.length}</div>
                      <div>• Макс версия отчета: {report?.document_version || 'undefined'}</div>
                      <div>• Текущая версия: {currentVersion || 'undefined'}</div>
                      <div>• Макс в истории: {maxHistoryVersion}</div>
                      <div>• Недостающих в истории: {allVersions.filter(v => !v.exists_in_history).length}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {!isCurrentVersion && currentVersion && report?.document_version && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-yellow-600">
                  Вы просматриваете старую версию
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => switchToVersion(report.document_version)}
                >
                  К текущей версии
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isCurrentVersion && (
              <Button
                onClick={() => createNewVersion('Ручное создание версии')}
              >
                Создать версию
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Область документа с улучшенным отображением */}
        <Card className="md:col-span-3 p-2 min-h-[calc(100vh-200px)] bg-gray-100">
          <div className="flex items-center justify-between mb-4 px-4 py-2">
            <h2 className="text-lg font-medium">
              Документ v{currentVersion || report?.document_version || '?'} 
              {!isCurrentVersion && currentVersion && report?.document_version && '(только просмотр)'}
            </h2>
            {selectedText && isCurrentVersion && (
              <div className="text-sm text-blue-600">
                Выделено: {selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}
              </div>
            )}
          </div>
          
          {/* Контейнер документа с прокруткой */}
          <div className="max-h-[calc(100vh-100px)] overflow-y-auto bg-gray-100 p-4">
            <div 
              ref={documentRef}
              className={`document-viewer shadow-lg ${
                !isCurrentVersion ? 'opacity-75' : ''
              }`}
              onMouseUp={isCurrentVersion ? handleTextSelection : undefined}
              dangerouslySetInnerHTML={{ __html: documentHtml }}
             
            />
          </div>
        </Card>

        {/* Область чата (2/5 ширины) */}
        <Card className="md:col-span-2 overflow-hidden p-0 min-h-[calc(100vh-200px)] flex flex-col">
          {!isCurrentVersion && currentVersion && report?.document_version && (
            <div className="bg-yellow-50 border-b border-yellow-200 p-3 text-center">
              <p className="text-sm text-yellow-800">
                Редактирование доступно только для текущей версии
              </p>
            </div>
          )}
          
          {/* Область чата (занимает большую часть) */}
          <div className="flex-grow overflow-hidden">
            {chatId && isCurrentVersion ? (
              <ChatWindow 
                chatId={chatId}
                initialMessage="" 
                onCustomCommand={handleChatCommand}
                isDocumentChat={true}
              />
            ) : isCurrentVersion ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin h-6 w-6 mr-2" />
                <span>Загрузка чата...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Чат недоступен для старых версий</p>
                  <p className="text-sm">Переключитесь на текущую версию для редактирования</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Индикатор выделенного текста (под чатом) */}
          {selectedText && showSelectedText && isCurrentVersion && (
            <div className="bg-blue-50 border-t border-blue-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-sm font-medium text-blue-700">
                  <Type className="h-4 w-4 mr-1" />
                  Выделенный фрагмент
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearSelectedText}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="bg-white border border-blue-200 rounded p-2 text-sm">
                <div className="text-gray-700 max-h-[100px] overflow-y-auto">
                  {selectedText}
                </div>
                {selectedParagraphId !== null && (
                  <div className="text-xs text-blue-600 mt-1">
                    Параграф: {selectedParagraphId}
                  </div>
                )}
              </div>
              <button 
                onClick={clearSelectedText}
                className="text-blue-600 hover:text-blue-800 text-xs mt-2 underline"
              >
                Очистить выделение
              </button>
            </div>
          )}
        </Card>
      </div>
      
      {/* Закрытие выпадающего списка при клике вне его */}
      {showVersionDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowVersionDropdown(false)}
        />
      )}
    </div>
  );
};

export default ReportEditorPage;