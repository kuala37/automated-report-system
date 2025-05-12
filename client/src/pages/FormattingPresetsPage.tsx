import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formattingApi } from '../api/ApiClient';
import { FormattingPreset } from '../types/formatting';
import { useToast } from '../utils/toast';
import { useNavigate } from 'react-router-dom';
import PresetManager from '../components/formatting/PresetManager';
import FormattingPanel from '../components/formatting/FormattingPanel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '../components/ui';
import { Button } from '../components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

const FormattingPresetsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedPreset, setSelectedPreset] = React.useState<FormattingPreset | null>(null);
  const [editedStyles, setEditedStyles] = React.useState(selectedPreset?.styles);

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['formatting-presets'],
    queryFn: formattingApi.getAllPresets,
  });

  React.useEffect(() => {
    if (selectedPreset) {
      setEditedStyles(selectedPreset.styles);
    } else if (presets.length > 0) {
      const defaultPreset = presets.find((p: FormattingPreset) => p.isDefault) || presets[0];
      setSelectedPreset(defaultPreset);
      setEditedStyles(defaultPreset.styles);
    }
  }, [selectedPreset, presets]);

  const createPresetMutation = useMutation({
    mutationFn: formattingApi.createPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formatting-presets'] });
      toast({
        title: 'Пресет создан',
        description: 'Пресет форматирования успешно создан',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updatePresetMutation = useMutation({
    mutationFn: ({ id, preset }: { id: number; preset: FormattingPreset }) =>
      formattingApi.updatePreset(id, preset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formatting-presets'] });
      toast({
        title: 'Пресет обновлен',
        description: 'Пресет форматирования успешно обновлен',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: formattingApi.deletePreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formatting-presets'] });
      toast({
        title: 'Пресет удален',
        description: 'Пресет форматирования успешно удален',
      });
      
      if (presets.length > 1) {
        const defaultPreset = presets.find((p: FormattingPreset) => p.isDefault && p.id !== selectedPreset?.id) || 
          presets.find((p: FormattingPreset) => p.id !== selectedPreset?.id);
        if (defaultPreset) {
          setSelectedPreset(defaultPreset);
        }
      } else {
        setSelectedPreset(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const setDefaultPresetMutation = useMutation({
    mutationFn: formattingApi.setDefaultPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formatting-presets'] });
      toast({
        title: 'Пресет по умолчанию',
        description: 'Пресет форматирования установлен по умолчанию',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSelectPreset = (preset: FormattingPreset) => {
    setSelectedPreset(preset);
    setEditedStyles(preset.styles);
  };

  const handleSavePreset = (preset: FormattingPreset) => {
    createPresetMutation.mutate(preset);
  };

  const handleDuplicatePreset = (preset: FormattingPreset) => {
    const { id, ...rest } = preset;
    const duplicatedPreset = {
      ...rest,
      name: `${preset.name} (копия)`,
      isDefault: false,
    };
    
    createPresetMutation.mutate(duplicatedPreset as FormattingPreset);
  };

  const handleUpdateCurrentPreset = () => {
    if (selectedPreset && selectedPreset.id && editedStyles) {
      updatePresetMutation.mutate({
        id: selectedPreset.id,
        preset: {
          ...selectedPreset,
          styles: editedStyles,
        }
      });
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleGoBack}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Пресеты форматирования</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Пресеты</CardTitle>
                <CardDescription>
                  Выберите или создайте пресет форматирования для ваших отчетов
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PresetManager
                  presets={presets}
                  selectedPresetId={selectedPreset?.id}
                  onSelectPreset={handleSelectPreset}
                  onSavePreset={handleSavePreset}
                  onDeletePreset={deletePresetMutation.mutate}
                  onDuplicatePreset={handleDuplicatePreset}
                  onSetDefaultPreset={setDefaultPresetMutation.mutate}
                  currentStyles={editedStyles}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                {/* <Button variant="outline" onClick={handleGoBack}>
                  Назад
                </Button> */}
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Настройки форматирования</CardTitle>
                <CardDescription>
                  {selectedPreset ? 
                    `Настройте стили форматирования для пресета "${selectedPreset.name}"` : 
                    'Выберите пресет для настройки'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPreset && editedStyles ? (
                  <div className="space-y-6">
                    <FormattingPanel
                      styles={editedStyles}
                      onChange={setEditedStyles}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-muted-foreground mb-4">
                      Выберите пресет для настройки или создайте новый
                    </p>
                  </div>
                )}
              </CardContent>
              {selectedPreset && editedStyles && (
                <CardFooter className="flex justify-end">
                  <Button
                    onClick={handleUpdateCurrentPreset}
                    disabled={!selectedPreset || updatePresetMutation.isPending}
                  >
                    {updatePresetMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      'Сохранить изменения'
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormattingPresetsPage;