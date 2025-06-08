import React, { useEffect, useState, useRef } from 'react';
import { chat as chatApi } from '../../api/ApiClient';
import { Button, Input, Card, CardContent, Tabs, TabsList, TabsTrigger, TabsContent } from '../ui';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '../../utils/toast';

interface ChatMessage {
  id: number;
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at: string;
}

interface Chat {
  id: number;
  title: string;
  messages: ChatMessage[];
}

interface ChatWindowForEditProps {
  chatId: number;
  initialMessage?: string;
  onCustomCommand?: (command: string) => Promise<void>;
  isDocumentChat?: boolean;
}

const ChatWindowForEdit: React.FC<ChatWindowForEditProps> = ({
  chatId,
  initialMessage = '',
  onCustomCommand,
  isDocumentChat = true // По умолчанию считаем, что это чат для редактирования документов
}) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Загрузка чата
  useEffect(() => {
    if (chatId) {
      fetchChat();
    }
  }, [chatId]);

  // Обновление подсказки при изменении initialMessage
  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const fetchChat = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getById(chatId);
      console.log("Fetched chat data:", data);
      
      // Сортировка сообщений по времени создания, если они есть
      if (data && data.messages) {
        data.messages = data.messages.sort((a: ChatMessage, b: ChatMessage) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      
      setChat(data);
    } catch (error) {
      console.error('Error fetching chat:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить чат',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;
    
    const messageText = message.trim();
    setMessage('');
    
    // Всегда обрабатываем сообщение как потенциальную команду редактирования для документ-чата
    if (isDocumentChat && onCustomCommand) {
      try {
        setLoading(true);
        
        // Добавляем сообщение в UI немедленно для лучшего UX
        // ВАЖНО: добавляем только то, что ввел пользователь, без контекста выделенного текста
        setChat(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [
              ...prev.messages,
              { 
                id: Date.now(), // Временный ID
                content: messageText, // Только введенный текст
                role: 'user', 
                created_at: new Date().toISOString() 
              }
            ]
          };
        });
        
        // Вызываем обработчик команды (который добавит контекст выделенного текста)
        await onCustomCommand(messageText);
        
        // Обновляем чат после выполнения команды
        await fetchChat();
      } catch (error) {
        console.error('Error processing edit command:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось обработать команду редактирования',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Обычное сообщение чата
      try {
        setLoading(true);
        await chatApi.addMessage(chatId, {content: messageText});
        await fetchChat();
      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось отправить сообщение',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
  };
  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Загрузка чата...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-50px)]">
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="text-xl font-semibold">
          {isDocumentChat ? 'Редактирование документа' : chat.title}
        </h2>
        {isDocumentChat && (
          <p className="text-sm text-gray-500 mt-1">
            Выделите текст в документе и задайте команду редактирования
          </p>
        )}
      </div>

      <div className="flex-grow overflow-auto p-4 space-y-4">
        {chat.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className={`max-w-[80%] p-3 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : msg.role === 'system'
                ? 'bg-muted/70 text-muted-foreground border border-gray-200'
                : 'bg-muted'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          {/* Обновляем подсказку в плейсхолдере */}
          <Input
            placeholder={isDocumentChat 
              ? "Введите команду редактирования..." 
              : "Введите сообщение..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={loading}
            className="flex-grow"
          />
          <Button onClick={handleSendMessage} disabled={loading || !message.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        {/* Обновляем подсказку внизу */}
        {isDocumentChat && (
          <p className="text-xs text-gray-500 mt-2">
            Опишите, какие изменения нужно внести в выделенный текст документа
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatWindowForEdit;