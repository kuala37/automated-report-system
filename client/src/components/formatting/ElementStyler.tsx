import React from 'react';
import { ElementStyle } from '../../types/formatting';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import FontSelector from './FontSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Toggle } from '../ui/toggle';
import { Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import ColorPicker from '../ui/ColorPicker';
import StylePreview from './StylePreview';

interface ElementStylerProps {
  style: ElementStyle;
  onChange: (style: ElementStyle) => void;
  preview?: string;
  borderOnly?: boolean;
}

const ElementStyler: React.FC<ElementStylerProps> = ({ 
  style, 
  onChange, 
  preview = "Пример текста", 
  borderOnly = false 
}) => {
  const handleChange = (field: keyof ElementStyle, value: any) => {
    onChange({
      ...style,
      [field]: value
    });
  };

  const handleFontStyleChange = (property: 'bold' | 'italic' | 'underline' | 'strikethrough', value: boolean) => {
    onChange({
      ...style,
      fontStyle: {
        ...style.fontStyle,
        [property]: value
      }
    });
  };

  if (borderOnly) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Стиль границы</Label>
            <Select
              value={style.borderStyle}
              onValueChange={(value) => handleChange('borderStyle', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите стиль" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Нет</SelectItem>
                <SelectItem value="solid">Сплошная</SelectItem>
                <SelectItem value="dashed">Пунктирная</SelectItem>
                <SelectItem value="dotted">Точечная</SelectItem>
                <SelectItem value="double">Двойная</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Цвет границы</Label>
            <ColorPicker 
              color={style.borderColor || '#000000'} 
              onChange={(color) => handleChange('borderColor', color)} 
            />
          </div>

          <div>
            <Label>Толщина границы (пт)</Label>
            <Input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={style.borderWidth}
              onChange={(e) => handleChange('borderWidth', Number(e.target.value))}
            />
          </div>
        </div>

        <StylePreview style={style} text={preview} borderOnly={true} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Шрифт</Label>
          <FontSelector 
            value={style.fontFamily} 
            onChange={(font) => handleChange('fontFamily', font)} 
          />
        </div>

        <div>
          <Label>Размер шрифта (пт)</Label>
          <Input
            type="number"
            min={6}
            max={72}
            value={style.fontSize}
            onChange={(e) => handleChange('fontSize', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Цвет текста</Label>
          <ColorPicker 
            color={style.fontColor || '#000000'} 
            onChange={(color) => handleChange('fontColor', color)} 
          />
        </div>

        <div>
          <Label>Цвет фона</Label>
          <ColorPicker 
            color={style.backgroundColor || '#ffffff'} 
            onChange={(color) => handleChange('backgroundColor', color)} 
          />
        </div>
      </div>

      <div>
        <Label>Стиль текста</Label>
        <div className="flex space-x-2 mt-1">
          <Toggle
            pressed={style.fontStyle?.bold}
            onPressedChange={(pressed) => handleFontStyleChange('bold', pressed)}
            aria-label="Toggle bold"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={style.fontStyle?.italic}
            onPressedChange={(pressed) => handleFontStyleChange('italic', pressed)}
            aria-label="Toggle italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={style.fontStyle?.underline}
            onPressedChange={(pressed) => handleFontStyleChange('underline', pressed)}
            aria-label="Toggle underline"
          >
            <Underline className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={style.fontStyle?.strikethrough}
            onPressedChange={(pressed) => handleFontStyleChange('strikethrough', pressed)}
            aria-label="Toggle strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
        </div>
      </div>

      <div>
        <Label>Выравнивание</Label>
        <div className="flex space-x-2 mt-1">
          <Toggle
            pressed={style.alignment === 'left'}
            onPressedChange={(pressed) => pressed && handleChange('alignment', 'left')}
            aria-label="Выравнивание по левому краю"
          >
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={style.alignment === 'center'}
            onPressedChange={(pressed) => pressed && handleChange('alignment', 'center')}
            aria-label="Выравнивание по центру"
          >
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={style.alignment === 'right'}
            onPressedChange={(pressed) => pressed && handleChange('alignment', 'right')}
            aria-label="Выравнивание по правому краю"
          >
            <AlignRight className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={style.alignment === 'justify'}
            onPressedChange={(pressed) => pressed && handleChange('alignment', 'justify')}
            aria-label="Выравнивание по ширине"
          >
            <AlignJustify className="h-4 w-4" />
          </Toggle>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Межстрочный интервал</Label>
        <div className="flex items-center gap-2">
          <Slider
            min={1}
            max={3}
            step={0.1}
            value={[style.lineSpacing || 1]}
            onValueChange={(value) => handleChange('lineSpacing', value[0])}
          />
          <span className="text-sm">{style.lineSpacing || 1}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Отступ между абзацами (пт)</Label>
        <Input
          type="number"
          min={0}
          max={72}
          value={style.paragraphSpacing}
          onChange={(e) => handleChange('paragraphSpacing', Number(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label>Отступ первой строки (пт)</Label>
        <Input
          type="number"
          min={0}
          max={72}
          value={style.indent}
          onChange={(e) => handleChange('indent', Number(e.target.value))}
        />
      </div>

      <StylePreview style={style} text={preview} />
    </div>
  );
};

export default ElementStyler;
