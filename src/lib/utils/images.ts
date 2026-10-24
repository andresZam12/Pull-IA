import { Category } from "@/types";

// Curated high-resolution tech imagery from Unsplash for each category
const categoryImages: Record<Category, string[]> = {
  [Category.AI]: [
    "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  ],
  [Category.ENGINEERING]: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
  ],
  [Category.PROGRAMMING]: [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
  ],
  [Category.EMPLOYABILITY]: [
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
  ],
};

/**
 * Returns a valid, high-resolution image URL for an article.
 * If the article does not provide an image, returns a curated category image deterministically.
 */
export function getArticleImage(
  articleId: string,
  category: Category | string,
  providedUrl?: string | null
): string {
  if (providedUrl && providedUrl.startsWith("http")) {
    return providedUrl;
  }

  const cat = (category as Category) in categoryImages ? (category as Category) : Category.ENGINEERING;
  const list = categoryImages[cat];

  // Pick deterministic index based on articleId char codes
  let hash = 0;
  for (let i = 0; i < articleId.length; i++) {
    hash = (hash + articleId.charCodeAt(i)) % list.length;
  }

  return list[hash];
}
