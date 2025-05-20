import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chat as chatApi } from '../../api/ApiClient';
import { Button, Input, Card, CardContent, TabsList, Tabs, TabsTrigger, TabsContent } from '../ui';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '../../utils/toast';
import DocumentAnalysis from './DocumentAnalysis'; 

interface Message {
  id: number;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface Chat {
  id: number;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

const ChatWindow: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chat, setChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChat = async () => {
    try {
      if (!chatId) return;
      
      const response = await chatApi.getById(parseInt(chatId));
      setChat(response);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить чат',
        variant: 'destructive',
      });
      navigate('/chats');
    }
  };

  useEffect(() => {
    loadChat();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !chatId) return;

    try {
      setLoading(true);
      const result = await chatApi.addMessage(parseInt(chatId), { content: message });
      setChat(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, ...result]
        };
      });
      setMessage('');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

 const handleDocumentAnalysis = (question: string, answer: string) => {
    // Добавляем результат анализа документа в чат
    setChat(prev => {
      if (!prev) return null;
      
      // Имитируем добавление сообщений в интерфейсе без повторного запроса
      const newMessages = [
        ...prev.messages,
        { 
          id: Date.now(), // Временный ID
          content: `[Вопрос по документу] ${question}`,
          role: 'user' as 'user', 
          created_at: new Date().toISOString() 
        },
        { 
          id: Date.now() + 1, // Временный ID
          content: answer,
          role: 'assistant' as 'assistant', 
          created_at: new Date().toISOString() 
        }
      ];
      
      return {
        ...prev,
        messages: newMessages
      };
    });
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">{chat.title}</h2>
      </div>

      <div className="flex-grow overflow-auto p-4 space-y-4">
        {chat.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <Card className={`max-w-[70%] ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              <CardContent className="p-3 whitespace-pre-wrap">
                {msg.content}
              </CardContent>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
    <Tabs defaultValue="chat" className="w-full">
        <TabsList className="mb-4 w-full">
        <TabsTrigger value="chat" className="flex-1">Чат</TabsTrigger>
        <TabsTrigger value="documents" className="flex-1">Документы</TabsTrigger>
        </TabsList>
          
          <TabsContent value="chat">
            <div className="flex gap-2">
              <Input
                placeholder="Введите сообщение..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={loading}
                className="flex-grow"
              />
              <Button onClick={handleSendMessage} disabled={loading || !message.trim()}>
                {loading ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="documents">
            <DocumentAnalysis 
              chatId={parseInt(chatId as string)} 
              onAnalysisComplete={handleDocumentAnalysis} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChatWindow;