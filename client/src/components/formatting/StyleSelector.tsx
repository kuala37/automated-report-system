import React, { useState, useEffect } from 'react';
import { FormattingPreset } from '../../types/formatting';
import { useQuery } from '@tanstack/react-query';
import { formattingApi } from '../../api/ApiClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import DocumentPreview from './DocumentPreview';
import StyleDiagram from './StyleDiagram';
import { Badge } from '../ui/badge';
import { Star, Settings } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface StyleSelectorProps {
  selectedPresetId?: number | null;
  onSelectPreset: (presetId: number) => void;
  onManagePresets: () => void;
  previewTitle?: string;
  previewSections?: Array<{ title: string; content: string; heading_level: number }>;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
  onManagePresets,
  previewTitle = 'Пример отчета',
  previewSections = [
    { title: 'Введение', content: '', heading_level: 1 },
    { title: 'Анализ данных', content: '', heading_level: 2 },
    { title: 'Результаты', content: '', heading_level: 2 },
    { title: 'Выводы', content: '', heading_level: 1 },
  ]
}) => {
  const [activeTab, setActiveTab] = useState<string>('grid');
  
  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['formatting-presets'],
    queryFn: formattingApi.getAllPresets,
  });

  const { data: selectedPreset } = useQuery<FormattingPreset | null>({
    queryKey: ['formatting-preset', selectedPresetId],
    queryFn: async () => {
      if (!selectedPresetId) {
        const defaultPreset = presets.find((p: FormattingPreset) => p.isDefault);
        return defaultPreset || null;
      }
      return formattingApi.getPresetById(selectedPresetId);
    },
    enabled: presets.length > 0,
  });

  useEffect(() => {
    if (!selectedPresetId && presets.length > 0) {
      const defaultPreset = presets.find((p: FormattingPreset) => p.isDefault);

      if (defaultPreset) {
        onSelectPreset(defaultPreset.id!);
      }
    }
  }, [presets, selectedPresetId, onSelectPreset]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Стиль документа</h2>
        <div className="flex space-x-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mr-2">
            <TabsList>
              <TabsTrigger value="grid">Сетка</TabsTrigger>
              <TabsTrigger value="preview">Предпросмотр</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={onManagePresets}>
            <Settings className="mr-2 h-4 w-4" />
            Управление пресетами
          </Button>
        </div>
      </div>

      <TabsContent value="grid" className="mt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {presets.map((preset: FormattingPreset) => (
            <Card 
                key={preset.id} 
                className={`cursor-pointer transition-all ${
                selectedPresetId === preset.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onSelectPreset(preset.id!)}
            >
              <CardHeader>
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      {preset.name}
                      {preset.isDefault && (
                        <Badge variant="secondary" className="ml-2">
                          <Star className="h-3 w-3 mr-1" />
                          По умолчанию
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{preset.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-sm grid grid-cols-2 gap-x-2 gap-y-1">
                  <div>
                    <span className="text-muted-foreground">Основной шрифт:</span> {preset.styles.paragraphs?.fontFamily || 'По умолчанию'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Размер:</span> {preset.styles.paragraphs?.fontSize || 'По умолчанию'} пт
                  </div>
                  <div>
                    <span className="text-muted-foreground">Страница:</span> {preset.styles.pageSetup.pageSize}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ориентация:</span> {preset.styles.pageSetup.orientation === 'portrait' ? 'Портретная' : 'Альбомная'}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPreset(preset.id!);
                  }}
                >
                  Применить
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </TabsContent>      <TabsContent value="preview" className="mt-0">
        {selectedPreset ? (
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedPreset.name}</CardTitle>
                  {selectedPreset.description && (
                    <CardDescription>{selectedPreset.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <h3 className="font-medium">Параметры страницы:</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                        <div>
                          <span className="text-muted-foreground">Размер:</span> {selectedPreset.styles.pageSetup.pageSize}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ориентация:</span> {selectedPreset.styles.pageSetup.orientation === 'portrait' ? 'Портретная' : 'Альбомная'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Шрифты:</h3>
                      <div className="mt-1">
                        <div>
                          <span className="text-muted-foreground">Заголовки:</span> {selectedPreset.styles.headings.h1?.fontFamily || 'По умолчанию'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Текст:</span> {selectedPreset.styles.paragraphs?.fontFamily || 'По умолчанию'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Поля (мм):</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                        <div>
                          <span className="text-muted-foreground">Верхнее:</span> {selectedPreset.styles.pageSetup.margins.top}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Нижнее:</span> {selectedPreset.styles.pageSetup.margins.bottom}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Левое:</span> {selectedPreset.styles.pageSetup.margins.left}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Правое:</span> {selectedPreset.styles.pageSetup.margins.right}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <StyleDiagram styles={selectedPreset.styles} />
              
              <div className="flex justify-end">
                <Button onClick={() => onSelectPreset(selectedPreset.id!)}>Применить</Button>
              </div>
            </div>
            
            <DocumentPreview 
              title={previewTitle}
              sections={previewSections}
              styles={selectedPreset.styles}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground">Пожалуйста, выберите пресет форматирования</p>
          </div>
        )}
      </TabsContent>
    </div>
  );
};

export default StyleSelector;
