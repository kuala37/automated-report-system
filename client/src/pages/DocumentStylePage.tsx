import React, { useState, useEffect } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { templates, reports, Template, Report } from '../api/ApiClient';
import { formattingApi } from '../api/ApiClient';
import { FormattingPreset } from '../types/formatting';
import { useToast } from '../utils/toast';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui';
import { Plus, AlertCircle, Loader2, Settings } from 'lucide-react';
import StylePreview from '../components/formatting/StylePreview';

interface Section {
  title: string;
  prompt: string;
  heading_level: number;
}

interface ReportData {
  title: string;
  template_id?: number | null;
  format: 'pdf' | 'doc' | 'docx';
  sections: Section[];
  formatting_preset_id?: number | null;
}

const DocumentStylePage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Добавляем получение location

  
  const [formattingPresetId, setFormattingPresetId] = useState<number | null>(null);
  const [returnStep, setReturnStep] = useState<number>(3); // По умолчанию возвращаемся на шаг 3
  const [originalReportData, setOriginalReportData] = useState<any>(null); // Для сохранения данных отчета
  
  const { data: presets = [] } = useQuery<FormattingPreset[]>({
    queryKey: ['formatting-presets'],
    queryFn: formattingApi.getAllPresets,
  });


    useEffect(() => {
    if (location.state) {
      if (location.state.formattingPresetId) {
        setFormattingPresetId(location.state.formattingPresetId);
      }
      
      if (location.state.currentStep) {
        setReturnStep(location.state.currentStep);
      }
      
      if (location.state.returnData) {
        setOriginalReportData(location.state.returnData);
      }
    }
  }, [location.state]);

  const { data: selectedPreset } = useQuery<FormattingPreset | null>({
    queryKey: ['formatting-preset', formattingPresetId],
    queryFn: async () => {
      if (!formattingPresetId) {
        const defaultPreset = presets.find(p => p.isDefault);
        return defaultPreset || null;
      }
      return formattingApi.getPresetById(formattingPresetId);
    },
    enabled: presets.length > 0,
  });

  React.useEffect(() => {
    if (!formattingPresetId && presets.length > 0) {
      const defaultPreset = presets.find(p => p.isDefault);
      if (defaultPreset) {
        setFormattingPresetId(defaultPreset.id!);
      }
    }
  }, [presets, formattingPresetId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Стиль документа</h1>
        <Button onClick={() => navigate('/formatting-presets')}>
          <Settings className="mr-2 h-4 w-4" />
          Управление пресетами
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Выбор стиля форматирования</CardTitle>
          <CardDescription>
            Выберите пресет форматирования для вашего отчета или создайте новый
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Пресет форматирования</label>
            <Select
              value={formattingPresetId?.toString() || ''}
              onValueChange={(value) => setFormattingPresetId(value ? parseInt(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите пресет форматирования" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem 
                    key={preset.id} 
                    value={preset.id!.toString()}
                  >
                    {preset.name} {preset.isDefault && '(по умолчанию)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedPreset && (
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="text-lg font-medium">{selectedPreset.name}</h3>
              {selectedPreset.description && (
                <p className="text-sm text-muted-foreground">{selectedPreset.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Заголовок 1 уровня</h4>
                  <StylePreview 
                    style={selectedPreset.styles.headings.h1 || {}} 
                    text="Пример заголовка 1 уровня" 
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Заголовок 2 уровня</h4>
                  <StylePreview 
                    style={selectedPreset.styles.headings.h2 || {}} 
                    text="Пример заголовка 2 уровня" 
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Текст абзаца</h4>
                  <StylePreview 
                    style={selectedPreset.styles.paragraphs || {}} 
                    text="Пример текста абзаца. Это демонстрирует, как будет выглядеть обычный текст в вашем документе." 
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Маркированный список</h4>
                  <StylePreview 
                    style={selectedPreset.styles.lists.bullet || {}} 
                    text="• Пример маркированного списка\n• Второй пункт\n• Третий пункт" 
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Параметры страницы</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Размер страницы:</span> {selectedPreset.styles.pageSetup.pageSize}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ориентация:</span> {selectedPreset.styles.pageSetup.orientation === 'portrait' ? 'Портретная' : 'Альбомная'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Верхнее поле:</span> {selectedPreset.styles.pageSetup.margins.top} мм
                  </div>
                  <div>
                    <span className="text-muted-foreground">Нижнее поле:</span> {selectedPreset.styles.pageSetup.margins.bottom} мм
                  </div>
                  <div>
                    <span className="text-muted-foreground">Левое поле:</span> {selectedPreset.styles.pageSetup.margins.left} мм
                  </div>
                  <div>
                    <span className="text-muted-foreground">Правое поле:</span> {selectedPreset.styles.pageSetup.margins.right} мм
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/generate', { 
              state: { 
                currentStep: returnStep,
                formattingPresetId: formattingPresetId,
                returnData: originalReportData // Передаем сохраненные данные обратно
              } 
            })}
          >
            Назад
          </Button>
        <Button 
          onClick={() => {
            const updatedReportData = originalReportData  ? {...originalReportData, formatting_preset_id: formattingPresetId }: null;
            navigate('/generate', { 
            state: { 
              currentStep: returnStep, 
              formattingPresetId: formattingPresetId,
              returnData: updatedReportData 
            } 
          })}}
        >
          Применить и продолжить
        </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DocumentStylePage;
