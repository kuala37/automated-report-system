import React, { useState } from 'react';
import { FormattingPreset } from '../../types/formatting';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { 
  Copy, 
  Edit, 
  MoreVertical, 
  Plus, 
  Save, 
  Star, 
  Trash2 
} from 'lucide-react';
import { Badge } from '../ui/badge';

interface PresetManagerProps {
  presets: FormattingPreset[];
  selectedPresetId?: number;
  onSelectPreset: (preset: FormattingPreset) => void;
  onSavePreset: (preset: FormattingPreset) => void;
  onDeletePreset: (id: number) => void;
  onDuplicatePreset: (preset: FormattingPreset) => void;
  onSetDefaultPreset: (id: number) => void;
  currentStyles?: FormattingPreset['styles'];
}

const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  selectedPresetId,
  onSelectPreset,
  onSavePreset,
  onDeletePreset,
  onDuplicatePreset,
  onSetDefaultPreset,
  currentStyles
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPreset, setNewPreset] = useState<Partial<FormattingPreset>>({
    name: '',
    description: ''
  });

  const handleSaveNewPreset = () => {
    if (!newPreset.name) return;
    
    onSavePreset({
      ...newPreset as FormattingPreset,
      styles: currentStyles || presets.find(p => p.id === selectedPresetId)?.styles || getDefaultStyles()
    });
    
    setNewPreset({ name: '', description: '' });
    setIsAddDialogOpen(false);
  };

  const getDefaultStyles = (): FormattingPreset['styles'] => {
    // Возвращаем базовые стили для нового пресета
    return {
      headings: {
        h1: { fontSize: 24, fontFamily: 'Arial', fontStyle: { bold: true } },
        h2: { fontSize: 20, fontFamily: 'Arial', fontStyle: { bold: true } },
        h3: { fontSize: 18, fontFamily: 'Arial', fontStyle: { bold: true } }
      },
      paragraphs: { fontSize: 12, fontFamily: 'Arial', lineSpacing: 1.15 },
      lists: {
        bullet: { fontSize: 12, fontFamily: 'Arial' },
        numbered: { fontSize: 12, fontFamily: 'Arial' }
      },
      tables: {
        header: { fontSize: 12, fontFamily: 'Arial', fontStyle: { bold: true } },
        cells: { fontSize: 12, fontFamily: 'Arial' },
        borders: { borderStyle: 'solid', borderWidth: 1, borderColor: '#000000' }
      },
      pageSetup: {
        margins: { top: 20, bottom: 20, left: 25, right: 25 },
        pageSize: 'A4' as 'A4' | 'Letter' | 'Legal' | 'A3',
        orientation: 'portrait'
      }
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Пресеты форматирования</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Создать пресет
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый пресет форматирования</DialogTitle>
              <DialogDescription>
                Создайте новый пресет на основе текущих настроек форматирования.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Название</Label>
                <Input 
                  id="preset-name" 
                  value={newPreset.name} 
                  onChange={e => setNewPreset({ ...newPreset, name: e.target.value })}
                  placeholder="Введите название пресета"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preset-description">Описание</Label>
                <Textarea 
                  id="preset-description" 
                  value={newPreset.description} 
                  onChange={e => setNewPreset({ ...newPreset, description: e.target.value })}
                  placeholder="Опишите назначение пресета"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Отмена</Button>
              <Button onClick={handleSaveNewPreset} disabled={!newPreset.name}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {presets.map((preset) => (
          <Card 
            key={preset.id} 
              className={`cursor-pointer transition-all flex flex-col ${
              selectedPresetId === preset.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelectPreset(preset)}
          >
            <CardHeader className="relative">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <span className="truncate max-w-[90px]" title={preset.name}>
                      {preset.name}
                    </span>
                    {preset.isDefault && (
                      <Badge variant="secondary" className="ml-2 flex-shrink-0">
                        <Star className="h-3 w-3 mr-1" />
                        По умолчанию
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="truncate" title={preset.description}>
                    {preset.description}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Действия</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onSetDefaultPreset(preset.id!);
                    }}>
                      <Star className="mr-2 h-4 w-4" />
                      Сделать по умолчанию
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePreset(preset);
                    }}>
                      <Copy className="mr-2 h-4 w-4" />
                      Дублировать
                    </DropdownMenuItem>
                    {!preset.isDefault && (
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePreset(preset.id!);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className='flex-grow'>
              <div className="text-sm">
                <p><strong>Шрифт заголовков:</strong> {preset.styles.headings.h1?.fontFamily || 'Не задан'}</p>
                <p><strong>Шрифт текста:</strong> {preset.styles.paragraphs?.fontFamily || 'Не задан'}</p>
                <p><strong>Размер страницы:</strong> {preset.styles.pageSetup.pageSize}</p>
              </div>
            </CardContent>
            <CardFooter className='mt-auto; flex justify-center'>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPreset(preset);
                }}
              >
                Применить
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PresetManager;
