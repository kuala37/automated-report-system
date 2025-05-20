export interface FontStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

export interface ElementStyle {
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  fontStyle?: FontStyle;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  lineSpacing?: number;
  paragraphSpacing?: number;
  indent?: number;
  borderStyle?: string;
  borderColor?: string;
  borderWidth?: number;
}

export interface DocumentStyles {
  headings: {
    h1?: ElementStyle;
    h2?: ElementStyle;
    h3?: ElementStyle;
    h4?: ElementStyle;
    h5?: ElementStyle;
    h6?: ElementStyle;
  };
  paragraphs: ElementStyle;
  lists: {
    bullet: ElementStyle;
    numbered: ElementStyle;
  };
  tables: {
    header: ElementStyle;
    cells: ElementStyle;
    borders: ElementStyle;
  };
  pageSetup: {
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    pageSize: 'A4' | 'Letter' | 'Legal' | 'A3';
    orientation: 'portrait' | 'landscape';
  };
}

export interface FormattingPreset {
  id?: number;
  name: string;
  description?: string;
  styles: DocumentStyles;
  isDefault?: boolean;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}
