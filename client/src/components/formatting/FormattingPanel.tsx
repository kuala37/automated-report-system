import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ElementStyle, DocumentStyles } from '../../types/formatting';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import FontSelector from './FontSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Toggle } from '../ui/toggle';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import ColorPicker from '../ui/ColorPicker';
import ElementStyler from './ElementStyler';
interface FormattingPanelProps {
  styles: DocumentStyles;
  onChange: (styles: DocumentStyles) => void;
}

const FormattingPanel: React.FC<FormattingPanelProps> = ({ styles, onChange }) => {
  const handleHeadingChange = (level: keyof DocumentStyles['headings'], style: ElementStyle) => {
    onChange({
      ...styles,
      headings: {
        ...styles.headings,
        [level]: style
      }
    });
  };

  const handleParagraphChange = (style: ElementStyle) => {
    onChange({
      ...styles,
      paragraphs: style
    });
  };

  const handleListChange = (type: keyof DocumentStyles['lists'], style: ElementStyle) => {
    onChange({
      ...styles,
      lists: {
        ...styles.lists,
        [type]: style
      }
    });
  };

  const handleTableChange = (part: keyof DocumentStyles['tables'], style: ElementStyle) => {
    onChange({
      ...styles,
      tables: {
        ...styles.tables,
        [part]: style
      }
    });
  };

  const handlePageSetupChange = (
    field: keyof DocumentStyles['pageSetup'],
    value: any
  ) => {
    onChange({
      ...styles,
      pageSetup: {
        ...styles.pageSetup,
        [field]: value
      }
    });
  };

  return (
    <Tabs defaultValue="headings" className="w-full">
      <TabsList className="grid grid-cols-5 mb-4">
        <TabsTrigger value="headings">Заголовки</TabsTrigger>
        <TabsTrigger value="paragraphs">Абзацы</TabsTrigger>
        <TabsTrigger value="lists">Списки</TabsTrigger>
        <TabsTrigger value="tables">Таблицы</TabsTrigger>
        <TabsTrigger value="pageSetup">Страница</TabsTrigger>
      </TabsList>

      <TabsContent value="headings">
        <Tabs defaultValue="h1">
          <TabsList className="mb-4">
            <TabsTrigger value="h1">H1</TabsTrigger>
            <TabsTrigger value="h2">H2</TabsTrigger>
            <TabsTrigger value="h3">H3</TabsTrigger>
            <TabsTrigger value="h4">H4</TabsTrigger>
            <TabsTrigger value="h5">H5</TabsTrigger>
            <TabsTrigger value="h6">H6</TabsTrigger>
          </TabsList>

          {Object.keys(styles.headings).map((level) => (
            <TabsContent key={level} value={level}>
              <ElementStyler
                style={styles.headings[level as keyof DocumentStyles['headings']] || {}}
                onChange={(style) => handleHeadingChange(level as keyof DocumentStyles['headings'], style)}
                preview={`Заголовок ${level.substring(1)}`}
              />
            </TabsContent>
          ))}
        </Tabs>
      </TabsContent>

      <TabsContent value="paragraphs">
        <ElementStyler
          style={styles.paragraphs}
          onChange={handleParagraphChange}
          preview="Пример текста абзаца для просмотра стиля. Это демонстрирует, как будет выглядеть обычный текст в вашем документе."
        />
      </TabsContent>

      <TabsContent value="lists">
        <Tabs defaultValue="bullet">
          <TabsList className="mb-4">
            <TabsTrigger value="bullet">Маркированные</TabsTrigger>
            <TabsTrigger value="numbered">Нумерованные</TabsTrigger>
          </TabsList>

          <TabsContent value="bullet">
            <ElementStyler
              style={styles.lists.bullet}
              onChange={(style) => handleListChange('bullet', style)}
              preview="• Пример маркированного списка\n• Второй пункт\n• Третий пункт"
            />
          </TabsContent>

          <TabsContent value="numbered">
            <ElementStyler
              style={styles.lists.numbered}
              onChange={(style) => handleListChange('numbered', style)}
              preview="1. Пример нумерованного списка\n2. Второй пункт\n3. Третий пункт"
            />
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="tables">
        <Tabs defaultValue="header">
          <TabsList className="mb-4">
            <TabsTrigger value="header">Заголовки</TabsTrigger>
            <TabsTrigger value="cells">Ячейки</TabsTrigger>
            <TabsTrigger value="borders">Границы</TabsTrigger>
          </TabsList>

          <TabsContent value="header">
            <ElementStyler
              style={styles.tables.header}
              onChange={(style) => handleTableChange('header', style)}
              preview="Заголовок таблицы"
            />
          </TabsContent>

          <TabsContent value="cells">
            <ElementStyler
              style={styles.tables.cells}
              onChange={(style) => handleTableChange('cells', style)}
              preview="Содержимое ячейки"
            />
          </TabsContent>

          <TabsContent value="borders">
            <ElementStyler
              style={styles.tables.borders}
              onChange={(style) => handleTableChange('borders', style)}
              preview="Границы таблицы"
              borderOnly={true}
            />
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="pageSetup">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Размер страницы</h3>
            <Select
              value={styles.pageSetup.pageSize}
              onValueChange={(value) => 
                handlePageSetupChange('pageSize', value as DocumentStyles['pageSetup']['pageSize'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите размер страницы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="A3">A3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Ориентация</h3>
            <Select
              value={styles.pageSetup.orientation}
              onValueChange={(value) => 
                handlePageSetupChange('orientation', value as DocumentStyles['pageSetup']['orientation'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите ориентацию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Портретная</SelectItem>
                <SelectItem value="landscape">Альбомная</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Поля (мм)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Верхнее</Label>
                <Input
                  type="number"
                  value={styles.pageSetup.margins.top}
                  onChange={(e) => 
                    handlePageSetupChange('margins', { 
                      ...styles.pageSetup.margins, 
                      top: Number(e.target.value) 
                    })
                  }
                />
              </div>
              <div>
                <Label>Нижнее</Label>
                <Input
                  type="number"
                  value={styles.pageSetup.margins.bottom}
                  onChange={(e) => 
                    handlePageSetupChange('margins', { 
                      ...styles.pageSetup.margins, 
                      bottom: Number(e.target.value) 
                    })
                  }
                />
              </div>
              <div>
                <Label>Левое</Label>
                <Input
                  type="number"
                  value={styles.pageSetup.margins.left}
                  onChange={(e) => 
                    handlePageSetupChange('margins', { 
                      ...styles.pageSetup.margins, 
                      left: Number(e.target.value) 
                    })
                  }
                />
              </div>
              <div>
                <Label>Правое</Label>
                <Input
                  type="number"
                  value={styles.pageSetup.margins.right}
                  onChange={(e) => 
                    handlePageSetupChange('margins', { 
                      ...styles.pageSetup.margins, 
                      right: Number(e.target.value) 
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default FormattingPanel;
