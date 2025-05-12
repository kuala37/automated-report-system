import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface FontSelectorProps {
  value?: string;
  onChange: (font: string) => void;
}

const FontSelector: React.FC<FontSelectorProps> = ({ value = 'Arial', onChange }) => {
  const fonts = [
    'Arial',
    'Calibri',
    'Times New Roman',
    'Verdana',
    'Georgia',
    'Tahoma',
    'Trebuchet MS',
    'Courier New',
    'Garamond',
    'Comic Sans MS',
    'Impact',
    'Palatino',
    'Century Gothic',
    'Lucida Sans',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat'
  ];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Выберите шрифт" />
      </SelectTrigger>
      <SelectContent>
        {fonts.map((font) => (
          <SelectItem key={font} value={font} style={{ fontFamily: font }}>
            {font}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default FontSelector;
