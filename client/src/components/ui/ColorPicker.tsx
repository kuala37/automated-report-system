import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { Input } from './input';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [localColor, setLocalColor] = useState(color);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setLocalColor(newColor);
    onChange(newColor);
  };

  const defaultColors = [
    '#000000', '#5E5E5E', '#0066CC', '#9A0000', '#006600',
    '#FFFFFF', '#EEEEEE', '#66CCFF', '#FF0000', '#00CC00',
    '#FFFF00', '#FF9900', '#9900CC', '#006666', '#FF66CC',
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-8 px-2 justify-start font-normal"
          style={{ backgroundColor: color }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="h-4 w-4 rounded-sm border"
              style={{ backgroundColor: color }}
            />
            <span className="truncate">{color}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {defaultColors.map((c) => (
              <button
                key={c}
                className="h-6 w-6 rounded-sm border"
                style={{ backgroundColor: c }}
                onClick={() => {
                  setLocalColor(c);
                  onChange(c);
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <div 
              className="h-8 w-8 rounded-sm border" 
              style={{ backgroundColor: localColor }}
            />
            <Input
              type="color"
              value={localColor}
              onChange={handleColorChange}
              className="w-full"
            />
          </div>
          <Input
            type="text"
            value={localColor}
            onChange={handleColorChange}
            className="w-full"
            placeholder="#RRGGBB"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorPicker;
