export interface SlideElement {
  id: string;
  type: 'text' | 'rect' | 'circle' | 'triangle' | 'line' | 'image';
  fabricId: string; // fabric object id
}

export interface Slide {
  id: string;
  title: string;
  fabricJson: string; // serialized fabric canvas JSON
  thumbnail: string; // base64 thumbnail
}

export interface HistoryEntry {
  slideId: string;
  fabricJson: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
