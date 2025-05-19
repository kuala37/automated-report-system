import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../ui';
import { Upload, FileText, FileQuestion, Loader2 } from 'lucide-react';
import { useToast } from '../../utils/toast';
import { documentAnalysis, chat } from '../../api/ApiClient';

interface Document {
  id: number;
  original_filename: string;
  file_type: string;
  created_at: string;
}

interface DocumentAnalysisProps {
  chatId: number;
  onAnalysisComplete?: (question: string, answer: string) => void;
}

const DocumentAnalysis: React.FC<DocumentAnalysisProps> = ({ chatId, onAnalysisComplete }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [chatId]);

  const loadDocuments = async () => {
    try {
      const docs = await documentAnalysis.getChatDocuments(chatId);
      setDocuments(docs);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список документов',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chat_id', chatId.toString());

    try {
      setUploading(true);
      await documentAnalysis.uploadDocument(formData);
      toast({
        title: 'Успешно',
        description: 'Документ успешно загружен',
      });
      await loadDocuments();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить документ',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedDocument || !question.trim()) return;

    try {
      setLoading(true);
      const response = await chat.analyzeDocument(chatId, {
        document_id: selectedDocument.id,
        question,
      });

      if (onAnalysisComplete) {
        onAnalysisComplete(question, response.content);
      }

      setQuestion('');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось проанализировать документ',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Анализ документов</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Загрузить документ</label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                className="hidden"
                id="document-upload"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
              />
              <label
                htmlFor="document-upload"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Выбрать файл
              </label>
            </div>
          </div>

          {documents.length > 0 && (
            <div>
              <label className="block mb-2 text-sm font-medium">Выбрать документ для анализа</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`cursor-pointer border rounded-md p-2 flex items-center ${
                      selectedDocument?.id === doc.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="truncate text-sm">{doc.original_filename}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedDocument && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Задайте вопрос по документу</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Например: О чем этот документ?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="flex-grow"
                />
                <Button onClick={handleAnalyzeDocument} disabled={loading || !question.trim()}>
                  {loading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <FileQuestion className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentAnalysis;