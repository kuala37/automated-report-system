from datetime import datetime
from pathlib import Path
from .word_generator import generate_report_document

class DocumentService:
    def __init__(self, output_dir="reports"):
        self.output_dir = output_dir
        Path(output_dir).mkdir(parents=True, exist_ok=True)

    def generate_report(self, title, sections, filename=None, gost_type=None):
        """
        Generate a report with the given title and sections
        
        Args:
            title (str): Report title
            sections (list): List of section configurations
            filename (str, optional): Custom filename. If not provided, will generate based on title
            gost_type (str, optional): GOST standard to use ("7.32" or "8.5")
        
        Returns:
            str: Path to the generated document
        """
        if not filename:
            # Create filename from title and timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{title.lower().replace(' ', '_')}_{timestamp}.docx"
        
        output_path = str(Path(self.output_dir) / filename)
        
        generate_report_document(title, sections, output_path, gost_type)
        return output_path

    def get_report_list(self):
        """Get list of generated reports"""
        path = Path(self.output_dir)
        return [str(f.relative_to(self.output_dir)) for f in path.glob("*.docx")]