import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chat as chatApi } from '../api/ApiClient';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui';
import { Plus, MessageCircle, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '../utils/toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Chat {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

const ChatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await chatApi.getAll();
      setChats(response);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список чатов',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const handleCreateChat = async () => {
    try {
      setCreating(true);
      const newChat = await chatApi.create({ title: 'Новый чат' });
      navigate(`/chats/${newChat.id}`);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать чат',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteChat = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await chatApi.delete(id);
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== id));
      toast({
        title: 'Успешно',
        description: 'Чат удален',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить чат',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'dd MMMM yyyy, HH:mm', { locale: ru });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Чаты с ИИ-ассистентом</h1>
        <Button onClick={handleCreateChat} disabled={creating}>
          {creating ? (
            <Loader2 className="animate-spin mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Новый чат
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      ) : chats.length === 0 ? (
        <Card className="text-center p-10">
          <CardContent>
            <p className="mb-4">У вас пока нет чатов с ассистентом</p>
            <Button onClick={handleCreateChat} disabled={creating}>
              {creating ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Создать первый чат
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chats.map((chat) => (
            <Card 
              key={chat.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/chats/${chat.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    {chat.title}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Обновлено: {formatDate(chat.updated_at)}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatsPage;