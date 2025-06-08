from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from bs4 import BeautifulSoup
import re

class WordToHtmlConverter:
    """Утилита для точной конвертации Word документов в HTML"""
    
    def __init__(self):
        self.pt_to_px_ratio = 0.75  # Коэффициент конвертации pt в px
    
    def convert_with_precise_formatting(self, docx_path: str) -> str:
        """Конвертирует DOCX в HTML с максимальным сохранением форматирования"""
        
        doc = Document(docx_path)
        html_parts = []
        
        # Создаем HTML структуру
        html_parts.append('<!DOCTYPE html>')
        html_parts.append('<html>')
        html_parts.append('<head>')
        html_parts.append('<meta charset="utf-8">')
        html_parts.append('<style>')
        html_parts.append(self._generate_comprehensive_css(doc))
        html_parts.append('</style>')
        html_parts.append('</head>')
        html_parts.append('<body>')
        html_parts.append('<div class="word-document-page">')
        
        # Группируем параграфы для обработки списков
        processed_paragraphs = self._process_lists_and_paragraphs(doc.paragraphs)
        
        for item in processed_paragraphs:
            html_parts.append(item)
        
        html_parts.append('</div>')
        html_parts.append('</body>')
        html_parts.append('</html>')
        
        return '\n'.join(html_parts)
    
    def _process_lists_and_paragraphs(self, paragraphs):
        """Обрабатывает параграфы и группирует их в списки"""
        result = []
        current_list = None
        list_type = None
        paragraph_index = 0
        
        for paragraph in paragraphs:
            # Проверяем, является ли параграф элементом списка
            is_list_item = self._is_list_paragraph(paragraph)
            
            if is_list_item:
                current_list_type = self._get_list_type(paragraph)
                
                # Если начинается новый список или меняется тип
                if current_list is None or current_list_type != list_type:
                    # Закрываем предыдущий список
                    if current_list is not None:
                        if list_type == 'bullet':
                            result.append('</ul>')
                        else:
                            result.append('</ol>')
                    
                    # Начинаем новый список
                    list_type = current_list_type
                    if list_type == 'bullet':
                        result.append('<ul class="word-list">')
                    else:
                        result.append('<ol class="word-list">')
                    current_list = []
                
                # Добавляем элемент списка
                list_item_html = self._convert_list_item_to_html(paragraph, paragraph_index)
                result.append(list_item_html)
                
            else:
                # Закрываем текущий список, если он открыт
                if current_list is not None:
                    if list_type == 'bullet':
                        result.append('</ul>')
                    else:
                        result.append('</ol>')
                    current_list = None
                    list_type = None
                
                # Обрабатываем как обычный параграф
                paragraph_html = self._convert_paragraph_to_html(paragraph, paragraph_index)
                result.append(paragraph_html)
            
            paragraph_index += 1
        
        # Закрываем последний список, если он открыт
        if current_list is not None:
            if list_type == 'bullet':
                result.append('</ul>')
            else:
                result.append('</ol>')
        
        return result
    
    def _is_list_paragraph(self, paragraph):
        """Проверяет, является ли параграф элементом списка"""
        # Проверяем numbering
        if paragraph._p.pPr is not None:
            numPr = paragraph._p.pPr.find(qn('w:numPr'))
            if numPr is not None:
                return True
        
        # Проверяем стиль
        style_name = paragraph.style.name.lower()
        if 'list' in style_name or 'bullet' in style_name:
            return True
        
        # Проверяем текст на маркеры
        text = paragraph.text.strip()
        if text.startswith(('• ', '- ', '* ', '○ ', '▪ ')):
            return True
        
        # Проверяем нумерованные списки
        if re.match(r'^\d+[\.\)]\s+', text):
            return True
        
        return False
    
    def _get_list_type(self, paragraph):
        """Определяет тип списка (bullet или number)"""
        # Проверяем numbering в XML
        if paragraph._p.pPr is not None:
            numPr = paragraph._p.pPr.find(qn('w:numPr'))
            if numPr is not None:
                # Проверяем abstract numbering для определения типа
                return 'number'  # По умолчанию считаем нумерованным
        
        # Проверяем по тексту
        text = paragraph.text.strip()
        if text.startswith(('• ', '- ', '* ', '○ ', '▪ ')):
            return 'bullet'
        elif re.match(r'^\d+[\.\)]\s+', text):
            return 'number'
        
        return 'bullet'  # По умолчанию
    
    def _convert_list_item_to_html(self, paragraph, index: int):
        """Конвертирует элемент списка в HTML"""
        # Получаем текст без маркеров
        text = paragraph.text.strip()
        
        # Убираем маркеры списка
        if text.startswith(('• ', '- ', '* ', '○ ', '▪ ')):
            text = text[2:].strip()
        elif re.match(r'^\d+[\.\)]\s+', text):
            text = re.sub(r'^\d+[\.\)]\s+', '', text).strip()
        
        # Добавляем атрибуты
        attributes = [
            f'data-paragraph-id="{index}"',
            f'data-style-name="{paragraph.style.name}"'
        ]
        
        # Добавляем inline стили
        styles = self._get_paragraph_styles(paragraph)
        if styles:
            attributes.append(f'style="{styles}"')
        
        # Обрабатываем содержимое
        if text:
            content = self._convert_runs_to_html_clean(paragraph.runs, text)
        else:
            content = '&nbsp;'
            attributes.append('data-is-empty="true"')
        
        attr_string = ' '.join(attributes)
        return f'<li {attr_string}>{content}</li>'
    
    def _convert_runs_to_html_clean(self, runs, expected_text):
        """Конвертирует runs для списков, убирая маркеры"""
        html_parts = []
        full_text = ''.join(run.text for run in runs)
        
        # Находим позицию, где начинается полезный текст (после маркера)
        if full_text.startswith(('• ', '- ', '* ', '○ ', '▪ ')):
            offset = 2
        elif re.match(r'^\d+[\.\)]\s+', full_text):
            match = re.match(r'^\d+[\.\)]\s+', full_text)
            offset = len(match.group())
        else:
            offset = 0
        
        current_pos = 0
        for run in runs:
            if not run.text:
                continue
            
            # Определяем какую часть run нужно обработать
            run_start = current_pos
            run_end = current_pos + len(run.text)
            
            if run_end <= offset:
                # Этот run полностью в маркере - пропускаем
                current_pos = run_end
                continue
            elif run_start < offset < run_end:
                # Маркер заканчивается в середине этого run
                text = run.text[offset - run_start:]
            else:
                # Весь run после маркера
                text = run.text
            
            # Экранируем HTML символы
            text = (text
                   .replace('&', '&amp;')
                   .replace('<', '&lt;')
                   .replace('>', '&gt;')
                   .replace('\n', '<br>')
                   .replace('\t', '&nbsp;&nbsp;&nbsp;&nbsp;'))
            
            # Применяем форматирование
            if text:
                html_parts.append(self._apply_run_formatting(text, run))
            
            current_pos = run_end
        
        return ''.join(html_parts)
    
    def _apply_run_formatting(self, text, run):
        """Применяет форматирование к тексту"""
        styles = []
        
        # Проверяем, есть ли реальное форматирование
        has_custom_font = run.font.name and run.font.name != 'Times New Roman'
        has_custom_size = run.font.size and run.font.size.pt != 12
        has_bold = run.font.bold
        has_italic = run.font.italic
        has_underline = run.font.underline
        has_color = run.font.color and run.font.color.rgb
        
        # Добавляем стили только если они отличаются от стандартных
        if has_custom_font:
            styles.append(f'font-family: "{run.font.name}", serif')
        
        if has_custom_size:
            styles.append(f'font-size: {run.font.size.pt}pt')
        
        if has_bold:
            styles.append('font-weight: bold')
        
        if has_italic:
            styles.append('font-style: italic')
        
        if has_underline:
            styles.append('text-decoration: underline')
        
        if has_color:
            color = f'#{run.font.color.rgb}'
            styles.append(f'color: {color}')
        
        # Оборачиваем в span ТОЛЬКО если есть стили
        if styles:
            style_string = '; '.join(styles)
            return f'<span style="{style_string}">{text}</span>'
        else:
            return text
    
    def _convert_paragraph_to_html(self, paragraph, index: int) -> str:
        """Конвертирует параграф в HTML с точным форматированием"""
        
        # Определяем тег на основе стиля
        tag = self._get_html_tag_for_style(paragraph.style.name)
        
        # Получаем атрибуты
        attributes = [
            f'data-paragraph-id="{index}"',
            f'data-style-name="{paragraph.style.name}"'
        ]
        
        # Добавляем inline стили
        styles = self._get_paragraph_styles(paragraph)
        if styles:
            attributes.append(f'style="{styles}"')
        
        # Обрабатываем содержимое
        if not paragraph.text.strip():
            # Пустой параграф
            attributes.append('data-is-empty="true"')
            content = '&nbsp;'  # Неразрывный пробел
        else:
            # Параграф с текстом
            content = self._convert_runs_to_html(paragraph.runs)
        
        attr_string = ' '.join(attributes)
        return f'<{tag} {attr_string}>{content}</{tag}>'
    
    def _get_html_tag_for_style(self, style_name: str) -> str:
        """Определяет HTML тег на основе стиля Word"""
        
        style_mapping = {
            'Heading 1': 'h1',
            'Heading 2': 'h2', 
            'Heading 3': 'h3',
            'Heading 4': 'h4',
            'Heading 5': 'h5',
            'Heading 6': 'h6',
            'Title': 'h1',
            'Subtitle': 'h2'
        }
        
        return style_mapping.get(style_name, 'p')
    
    def _get_paragraph_styles(self, paragraph) -> str:
        """Извлекает CSS стили для параграфа"""
        
        styles = []
        pf = paragraph.paragraph_format
        style_name = paragraph.style.name
        
        # Специальная обработка для заголовков
        if 'Heading' in style_name or style_name in ['Title', 'Subtitle']:
            # Заголовки по умолчанию центрируются (это делается в CSS)
            # Но если есть явное выравнивание - используем его
            if pf.alignment and pf.alignment != WD_ALIGN_PARAGRAPH.CENTER:
                if pf.alignment == WD_ALIGN_PARAGRAPH.LEFT:
                    styles.append('text-align: left')
                elif pf.alignment == WD_ALIGN_PARAGRAPH.RIGHT:
                    styles.append('text-align: right')
                elif pf.alignment == WD_ALIGN_PARAGRAPH.JUSTIFY:
                    styles.append('text-align: justify')
        else:
            # Для обычных параграфов
            if pf.alignment == WD_ALIGN_PARAGRAPH.CENTER:
                styles.append('text-align: center')
            elif pf.alignment == WD_ALIGN_PARAGRAPH.RIGHT:
                styles.append('text-align: right')
            elif pf.alignment == WD_ALIGN_PARAGRAPH.JUSTIFY:
                styles.append('text-align: justify')
        
        # Отступы
        if pf.left_indent:
            styles.append(f'margin-left: {pf.left_indent.pt * self.pt_to_px_ratio}px')
        
        if pf.right_indent:
            styles.append(f'margin-right: {pf.right_indent.pt * self.pt_to_px_ratio}px')
        
        # Отступ первой строки (НЕ для заголовков, если они центрированы)
        if pf.first_line_indent and not ('Heading' in style_name and pf.alignment != WD_ALIGN_PARAGRAPH.LEFT):
            indent_value = pf.first_line_indent.pt * self.pt_to_px_ratio
            styles.append(f'text-indent: {indent_value}px')
        
        # Интервалы
        if pf.space_before:
            styles.append(f'margin-top: {pf.space_before.pt * self.pt_to_px_ratio}px')
        
        if pf.space_after:
            styles.append(f'margin-bottom: {pf.space_after.pt * self.pt_to_px_ratio}px')
        
        if pf.line_spacing and pf.line_spacing != 1.0:
            styles.append(f'line-height: {pf.line_spacing}')
        
        return '; '.join(styles)
    
    def _convert_runs_to_html(self, runs) -> str:
        """Конвертирует runs (форматированные части текста) в HTML"""
        
        html_parts = []
        
        for run in runs:
            if not run.text:
                continue
            
            # Экранируем HTML символы
            text = (run.text
                   .replace('&', '&amp;')
                   .replace('<', '&lt;')
                   .replace('>', '&gt;')
                   .replace('\n', '<br>')
                   .replace('\t', '&nbsp;&nbsp;&nbsp;&nbsp;'))
            
            html_parts.append(self._apply_run_formatting(text, run))
        
        return ''.join(html_parts)
    
    def _generate_comprehensive_css(self, doc: Document) -> str:
        """Генерирует полный CSS для документа с правильными селекторами"""
        
        section = doc.sections[0]
        
        # Базовые размеры страницы
        page_width = section.page_width.pt * self.pt_to_px_ratio
        page_height = section.page_height.pt * self.pt_to_px_ratio
        top_margin = section.top_margin.pt * self.pt_to_px_ratio
        bottom_margin = section.bottom_margin.pt * self.pt_to_px_ratio
        left_margin = section.left_margin.pt * self.pt_to_px_ratio
        right_margin = section.right_margin.pt * self.pt_to_px_ratio
        
        css = f"""
        /* Сброс стилей для body */
        body {{
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            font-family: inherit;
        }}
        
        .word-document-page {{
            width: {page_width}px;
            min-height: {page_height}px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border: 1px solid #d0d0d0;
            padding: {top_margin}px {right_margin}px {bottom_margin}px {left_margin}px;
            position: relative;
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.15;
            color: #000000;
            box-sizing: border-box;
        }}
        
        /* Базовые стили для всех элементов */
        .word-document-page p,
        .word-document-page h1,
        .word-document-page h2,
        .word-document-page h3,
        .word-document-page h4,
        .word-document-page h5,
        .word-document-page h6 {{
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.15 !important;
            word-wrap: break-word;
            font-family: 'Times New Roman', Times, serif !important;
        }}
        
        /* Обычные параграфы */
        .word-document-page p {{
            font-size: 12pt !important;
            font-weight: normal !important;
            color: #000000 !important;
            text-indent: 1.25cm !important;
            margin-bottom: 0 !important;
            text-align: justify !important;
        }}
        
        /* Заголовки - ЦЕНТРИРОВАНИЕ И СИНИЙ ЦВЕТ */
        .word-document-page h1,
        .word-document-page h2,
        .word-document-page h3 {{
            text-align: center !important;
            text-indent: 0 !important;
            color: #4472C4 !important;
            font-weight: bold !important;
            margin-bottom: 12pt !important;
            margin-top: 12pt !important;
        }}
        
        .word-document-page h1 {{
            font-size: 16pt !important;
        }}
        
        .word-document-page h2 {{
            font-size: 14pt !important;
        }}
        
        .word-document-page h3 {{
            font-size: 12pt !important;
        }}
        
        /* Специальные заголовки по тексту */
        .word-document-page h2[data-style-name*="Heading"] {{
            text-align: left !important;
            color: #4472C4 !important;
            text-indent: 0 !important;
        }}
        
        /* Стили для списков */
        .word-document-page ul.word-list,
        .word-document-page ol.word-list {{
            margin: 0 !important;
            padding-left: 1.5cm !important;
            list-style-position: outside !important;
            margin-bottom: 6pt !important;
        }}
        
        .word-document-page ul.word-list {{
            list-style-type: disc !important;
        }}
        
        .word-document-page ol.word-list {{
            list-style-type: decimal !important;
        }}
        
        .word-document-page li {{
            margin: 0 !important;
            padding: 0 2pt !important;
            text-indent: 0 !important;
            line-height: 1.15 !important;
            font-size: 12pt !important;
            color: #000000 !important;
            text-align: left !important;
        }}
        
        /* Жирный текст в списках */
        .word-document-page li span[style*="font-weight: bold"] {{
            font-weight: bold !important;
        }}
        
        /* Пустые параграфы */
        .word-document-page [data-is-empty="true"] {{
            height: 1.15em !important;
            min-height: 1.15em !important;
        }}
        
        /* Интерактивность */
        .word-document-page [data-paragraph-id]:hover {{
            background-color: rgba(0, 120, 212, 0.05) !important;
        }}
        
        .word-document-page ::selection {{
            background-color: #0078d4 !important;
            color: white !important;
        }}
        
        /* Адаптивность */
        @media (max-width: 1200px) {{
            .word-document-page {{
                width: 95% !important;
                padding: {top_margin * 0.7}px {right_margin * 0.7}px {bottom_margin * 0.7}px {left_margin * 0.7}px !important;
            }}
        }}
        
        @media (max-width: 768px) {{
            body {{
                padding: 10px !important;
            }}
            
            .word-document-page {{
                width: 100% !important;
                padding: 20px !important;
            }}
        }}
        """
        
        return css