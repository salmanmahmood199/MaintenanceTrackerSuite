export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  references: string[];
  date: string;
  author: string;
  category: string;
  readTime: string;
  image: string;
}

export const blogPosts: BlogPost[] = [];