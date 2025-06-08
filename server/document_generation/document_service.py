from datetime import datetime
import os
from pathlib import Path
from .word_generator import WordDocumentGenerator

class DocumentService:
    def __init__(self, output_dir="reports"):
        self.output_dir = output_dir
        Path(output_dir).mkdir(parents=True, exist_ok=True)

    def generate_report(self, title, sections, format='docx', formatting_styles=None):
        """
        Generate a report document with the given title and sections.
        
        Args:
            title (str): The title of the report
            sections (list): List of section dictionaries
            format (str): Output format (pdf, doc, docx)
            formatting_styles (dict): Formatting styles from preset
        """
        # Create a document generator with proper configuration
        if formatting_styles:
            custom_style = self._create_custom_style(formatting_styles)
            doc_generator = WordDocumentGenerator(gost_style=custom_style)
        else:
            gost_type = "7.32" if format == "docx" else None
            doc_generator = WordDocumentGenerator(gost_type=gost_type)
        
        doc_generator.add_title(title)
        
        previous_content = []

        for i, section in enumerate(sections):
            heading_level = section.get('heading_level', 1)
            
            context_prompt = section['prompt']
            
            if i > 0 and previous_content:
                context = "\n\n".join(previous_content)
                context_prompt = f"""
                Предыдущие разделы содержали следующее содержание:
                ---
                {context}
                ---

                Основываясь на этом содержании, {section['prompt']}
                """
            
            content = doc_generator.add_generated_section(
                prompt=context_prompt,
                section_title=section['title'],
                heading_level=heading_level
            )
            
            # content_summary = content[:300] + "..." if len(content) > 300 else content
            previous_content.append(f"Раздел {section['title']}: {content}")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{title.replace(' ', '_')}_{timestamp}"
        file_path = os.path.join(self.output_dir, f"{filename}.{format}")
        
        doc_generator.save(file_path)
        
        if format == 'pdf' and os.path.exists(file_path.replace('.pdf', '.docx')):
            self._convert_to_pdf(file_path.replace('.pdf', '.docx'), file_path)
        
        return file_path

    def get_report_list(self):
        """Get list of generated reports"""
        path = Path(self.output_dir)
        return [str(f.relative_to(self.output_dir)) for f in path.glob("*.docx")]
    
    def _create_custom_style(self, formatting_styles):
        """
        Create custom document style from formatting preset
        
        Args:
            formatting_styles (dict): Styles from formatting preset
        """
        from document_generation.word_generator import GostStyle
        from docx.shared import Pt, Cm

        custom_style = GostStyle(gost_type=None)  # Создаем пустой стиль
        
        try:
            # Margins (поля страницы)
            if 'pageSetup' in formatting_styles and 'margins' in formatting_styles['pageSetup']:
                margins = formatting_styles['pageSetup']['margins']
                custom_style.margins = {
                    "top": Cm(float(margins.get('top', 20)) / 10),     # перевод из мм в см
                    "bottom": Cm(float(margins.get('bottom', 20)) / 10),
                    "left": Cm(float(margins.get('left', 30)) / 10),
                    "right": Cm(float(margins.get('right', 15)) / 10)
                }
            
            # Font (шрифт)
            if 'font' in formatting_styles:
                font_settings = formatting_styles['font']
                if 'family' in font_settings:
                    custom_style.font_name = font_settings['family']
            
            # Paragraph settings (настройки абзаца)
            if 'paragraphs' in formatting_styles:
                p_settings = formatting_styles['paragraphs']
                
                # Font family for paragraphs - имеет приоритет над общим шрифтом
                if 'fontFamily' in p_settings:
                    custom_style.font_name = p_settings['fontFamily']
                
                # Font size for regular text
                if 'fontSize' in p_settings:
                    custom_style.main_font_size = Pt(float(p_settings['fontSize']))
                
                # Line spacing
                if 'lineHeight' in p_settings or 'lineSpacing' in p_settings:
                    custom_style.line_spacing = float(p_settings.get('lineHeight', p_settings.get('lineSpacing', 1.5)))
                
                # First line indent
                if 'firstLineIndent' in p_settings:
                    custom_style.first_line_indent = Cm(float(p_settings['firstLineIndent']) / 10)
            
            # Heading styles (стили заголовков)
            if 'headings' in formatting_styles:
                headings = formatting_styles['headings']
                
                # H1 settings
                if 'h1' in headings:
                    h1 = headings['h1']
                    if 'fontSize' in h1:
                        custom_style.heading_font_size = Pt(float(h1['fontSize']))
                
                # Store all heading styles for later use
                custom_style.heading_styles = headings
            
            # Lists (списки)
            if 'lists' in formatting_styles:
                custom_style.list_styles = formatting_styles['lists']
            
            # Page setup (настройки страницы)
            if 'pageSetup' in formatting_styles:
                page_setup = formatting_styles['pageSetup']
                
                # Page orientation
                if 'orientation' in page_setup:
                    custom_style.orientation = page_setup['orientation']
                
                # Page size
                if 'pageSize' in page_setup:
                    custom_style.page_size = page_setup['pageSize']
            
            # Для отладки - вывод данных стиля
            print(f"Custom style configuration: Font={custom_style.font_name}, Size={custom_style.main_font_size}")
            if hasattr(custom_style, 'heading_styles'):
                for h_key, h_style in custom_style.heading_styles.items():
                    print(f"Heading {h_key}: {h_style}")
            
        except Exception as e:
            print(f"Error creating custom style: {str(e)}")
            # В случае ошибки возвращаем стандартный стиль
            return GostStyle()
            
        return custom_style

    # Добавляем асинхронный метод для генерации отчета

    async def generate_report_async(self, title, sections, format='docx', formatting_styles=None):
        """Асинхронная версия generate_report для использования с await"""
        import asyncio
        # Используем run_in_executor для выполнения синхронной функции в отдельном потоке
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None, 
            self.generate_report,
            title, sections, format, formatting_styles
        )