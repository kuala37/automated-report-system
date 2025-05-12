from docx import Document
from docx.shared import Inches, Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION, WD_ORIENT
import os
from generation.generate_text_langchain import generate_text, generate_text_with_params

class GostStyle:
    """GOST document styling configuration"""
    def __init__(self, gost_type="8.5"):
        self.gost_type = gost_type
        # ГОСТ 7.32-2017 
        if gost_type == "7.32":
            self.margins = {
                "top": Cm(2), "bottom": Cm(2),
                "left": Cm(2.5), "right": Cm(1.5)
            }
            self.font_name = "Times New Roman"
            self.main_font_size = Pt(14)
            self.heading_font_size = Pt(16)
            self.line_spacing = 1.5
            self.first_line_indent = Cm(1.25)
            self.orientation = "portrait"
            self.page_size = "A4"
        # ГОСТ 8.5 or custom
        else:
            self.margins = {
                "top": Cm(2), "bottom": Cm(2),
                "left": Cm(3), "right": Cm(1.5)
            }
            self.font_name = "Times New Roman"
            self.main_font_size = Pt(12)
            self.heading_font_size = Pt(14)
            self.line_spacing = 1.5
            self.first_line_indent = Cm(1.25)
            self.orientation = "portrait"
            self.page_size = "A4"
            # Дополнительные стили, которые будут заполнены при создании пользовательского стиля
            self.heading_styles = None
            self.list_styles = None

class WordDocumentGenerator:
    def __init__(self, gost_style=None):
        self.document = Document()
        self.style = gost_style if gost_style else GostStyle()
        self._apply_gost_formatting()

    def _apply_gost_formatting(self):
        """Применить форматирование документа на основе выбранного стиля"""
        section = self.document.sections[0]
        
        # Установка полей
        section.top_margin = self.style.margins["top"]
        section.bottom_margin = self.style.margins["bottom"]
        section.left_margin = self.style.margins["left"]
        section.right_margin = self.style.margins["right"]
        
        # Установка ориентации страницы
        if hasattr(self.style, 'orientation') and self.style.orientation == 'landscape':
            section.orientation = WD_ORIENT.LANDSCAPE
        else:
            section.orientation = WD_ORIENT.PORTRAIT

        # Установка стиля абзаца по умолчанию
        style = self.document.styles['Normal']
        font = style.font
        font.name = self.style.font_name
        font.size = self.style.main_font_size
        
        # Установка форматирования абзаца
        paragraph_format = style.paragraph_format
        paragraph_format.line_spacing = self.style.line_spacing
        paragraph_format.first_line_indent = self.style.first_line_indent
        
        self._apply_custom_heading_styles()
        
    def _apply_custom_heading_styles(self):
        """Применить пользовательские стили заголовков, если они определены в объекте стиля"""
        if not hasattr(self.style, 'heading_styles') or not self.style.heading_styles:
            return
            
        heading_styles = self.style.heading_styles
        
        # Словарь для значений выравнивания
        alignment_map = {
            'left': WD_ALIGN_PARAGRAPH.LEFT,
            'center': WD_ALIGN_PARAGRAPH.CENTER,
            'right': WD_ALIGN_PARAGRAPH.RIGHT,
            'justify': WD_ALIGN_PARAGRAPH.JUSTIFY
        }
        
        # Обработка каждого уровня заголовка (h1, h2, h3)
        for level in range(1, 4):
            heading_key = f'h{level}'
            if heading_key in heading_styles:
                h_style = heading_styles[heading_key]
                doc_style = self.document.styles[f'Heading {level}']
                
                # Применить семейство шрифтов
                if 'fontFamily' in h_style:
                    doc_style.font.name = h_style['fontFamily']
                else:
                    doc_style.font.name = self.style.font_name
                
                # Применить размер шрифта
                if 'fontSize' in h_style:
                    doc_style.font.size = Pt(h_style['fontSize'])
                elif level == 1:
                    doc_style.font.size = self.style.heading_font_size
                
                # Применить начертание шрифта
                if 'fontWeight' in h_style:
                    doc_style.font.bold = h_style['fontWeight'] == 'bold'
                    
                # Применить выравнивание текста
                if 'textAlign' in h_style and h_style['textAlign'] in alignment_map:
                    doc_style.paragraph_format.alignment = alignment_map[h_style['textAlign']]
                
                # Применить цвет текста, если указан
                if 'color' in h_style:
                    # Цвет в RGB или именованный цвет, если поддерживается
                    doc_style.font.color.rgb = self._parse_color(h_style['color'])

    def _apply_font_to_heading(self, heading_paragraph, heading_level):
        """Явное применение стиля шрифта к параграфу заголовка"""
        # Проверяем, есть ли кастомные стили для заголовков
        if not hasattr(self.style, 'heading_styles') or not self.style.heading_styles:
            return
        
        heading_key = f'h{heading_level}'
        if heading_key not in self.style.heading_styles:
            return
        
        h_style = self.style.heading_styles[heading_key]
        
        # Получаем все runs в заголовке и применяем стиль к каждому
        for run in heading_paragraph.runs:
            # Шрифт
            if 'fontFamily' in h_style:
                run.font.name = h_style['fontFamily']
            else:
                run.font.name = self.style.font_name
            
            # Размер шрифта
            if 'fontSize' in h_style:
                run.font.size = Pt(float(h_style['fontSize']))
            elif heading_level == 1:
                run.font.size = self.style.heading_font_size
            
            # Стиль шрифта (жирный, курсив и т.д.)
            if 'fontStyle' in h_style:
                font_style = h_style['fontStyle']
                if isinstance(font_style, dict):
                    if 'bold' in font_style:
                        run.font.bold = font_style['bold']
                    if 'italic' in font_style:
                        run.font.italic = font_style['italic']
            elif 'fontWeight' in h_style:
                run.font.bold = h_style['fontWeight'] == 'bold'
            
            # Цвет текста
            if 'color' in h_style:
                run.font.color.rgb = self._parse_color(h_style['color'])
        
        # Для выравнивания (применяется к параграфу целиком)
        if 'textAlign' in h_style:
            alignment_map = {
                'left': WD_ALIGN_PARAGRAPH.LEFT,
                'center': WD_ALIGN_PARAGRAPH.CENTER,
                'right': WD_ALIGN_PARAGRAPH.RIGHT,
                'justify': WD_ALIGN_PARAGRAPH.JUSTIFY
            }
            if h_style['textAlign'] in alignment_map:
                heading_paragraph.alignment = alignment_map[h_style['textAlign']]          

    def _parse_color(self, color_value):
        """Преобразование строки цвета в значение RGB"""
        # Предполагаем, что цвет может быть в формате #RRGGBB
        if color_value.startswith('#') and len(color_value) == 7:
            r = int(color_value[1:3], 16)
            g = int(color_value[3:5], 16)
            b = int(color_value[5:7], 16)
            from docx.shared import RGBColor
            return RGBColor(r, g, b)
        return None

    def add_title(self, title, size=None):
        """Добавляет заголовок документа с указанным форматированием"""
        title_paragraph = self.document.add_paragraph()
        
        # Применяем пользовательский стиль заголовка, если доступен
        if hasattr(self.style, 'heading_styles') and self.style.heading_styles and 'title' in self.style.heading_styles:
            title_style = self.style.heading_styles['title']
            
            # Добавляем текст
            title_run = title_paragraph.add_run(title)
            
            # Применяем шрифт
            if 'fontFamily' in title_style:
                title_run.font.name = title_style['fontFamily']
            else:
                title_run.font.name = self.style.font_name
                
            # Применяем размер шрифта
            if 'fontSize' in title_style:
                title_run.font.size = Pt(title_style['fontSize'])
            else:
                title_run.font.size = self.style.heading_font_size
            
            # Применяем начертание шрифта
            if 'fontWeight' in title_style:
                title_run.font.bold = title_style['fontWeight'] == 'bold'
            
            # Применяем выравнивание
            if 'textAlign' in title_style:
                alignment_map = {
                    'left': WD_ALIGN_PARAGRAPH.LEFT,
                    'center': WD_ALIGN_PARAGRAPH.CENTER,
                    'right': WD_ALIGN_PARAGRAPH.RIGHT,
                    'justify': WD_ALIGN_PARAGRAPH.JUSTIFY
                }
                if title_style['textAlign'] in alignment_map:
                    title_paragraph.alignment = alignment_map[title_style['textAlign']]
        else:
            # Стиль заголовка по умолчанию
            title_run = title_paragraph.add_run(title)
            title_run.font.size = Pt(size) if size else self.style.heading_font_size
            title_run.font.bold = True
            title_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
            
        self.document.add_paragraph()  # Добавляем пустой абзац после заголовка

    # Остальные методы останутся без изменений
    def add_section(self, title, content, heading_level=1):
        """Добавить раздел с заголовком и содержимым"""
        # Добавляем заголовок с соответствующим уровнем
        heading = self.document.add_heading(title, level=heading_level)
        
        self._apply_font_to_heading(heading, heading_level)

        # Разбиваем контент на абзацы и добавляем каждый абзац
        paragraphs = content.split("\n")
        for para_text in paragraphs:
            if para_text.strip():  # Пропускаем пустые строки
                self.add_paragraph_text(para_text)
    
    def add_generated_section(self, prompt, section_title, heading_level=1, **generation_params):
        """Добавить раздел с автоматически сгенерированным содержимым"""
        # Генерация контента с использованием ИИ сервиса
        try:
            content = generate_text_with_params(prompt, **generation_params)
        except Exception as e:
            print(f"Ошибка генерации контента: {str(e)}")
            content = f"[Ошибка генерации контента: {str(e)}]"
        
        # Добавление раздела с сгенерированным контентом
        self.add_section(section_title, content, heading_level)

        return content
    
    def add_paragraph_text(self, text):
        """Добавить простой абзац текста со стилем"""
        paragraph = self.document.add_paragraph()
        
        # Добавить текст в абзац
        paragraph.add_run(text)
        
        # Применить стиль абзаца, если он определен в пользовательском стиле
        if hasattr(self.style, 'paragraphs') and self.style.paragraphs:
            p_style = self.style.paragraphs
            
            # Применить выравнивание текста, если указано
            if 'textAlign' in p_style:
                alignment_map = {
                    'left': WD_ALIGN_PARAGRAPH.LEFT,
                    'center': WD_ALIGN_PARAGRAPH.CENTER,
                    'right': WD_ALIGN_PARAGRAPH.RIGHT,
                    'justify': WD_ALIGN_PARAGRAPH.JUSTIFY
                }
                if p_style['textAlign'] in alignment_map:
                    paragraph.alignment = alignment_map[p_style['textAlign']]
               
    def save(self, filename):
        """Сохранить документ по указанному пути"""
        self.document.save(filename)