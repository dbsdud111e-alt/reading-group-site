import { Book, Calendar, Home, BookOpen, Layers, Settings, Search, PlusCircle, MessageSquare, Lightbulb } from 'lucide-react';

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  cover_url: string;
  description?: string;
  isbn?: string;
  toc?: string;
  status: 'want' | 'reading' | 'completed';
  tags: string[];
  created_at: string;
}

export interface Journal {
  id: string;
  user_id: string;
  book_id: string;
  category: 'memo' | 'summary' | 'question' | 'feeling' | 'idea';
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    display_name: string;
    avatar_url: string;
  };
}

export interface Schedule {
  id: string;
  book_id: string;
  book_title?: string;
  book_cover?: string;
  start_date: string;
  end_date: string;
  range_text: string; // e.g., "Chapters 1-2" or "Up to Part 1"
  created_at: string;
}

export interface LessonContent {
  id: string;
  user_id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: 'hwp' | 'ppt' | 'pdf' | 'link' | 'other';
  is_finished: boolean;
  tags: string[];
  created_at: string;
}
