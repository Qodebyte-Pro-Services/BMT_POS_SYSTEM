export interface ImageUrl {
  filename?: string;
  url: string;
}


export function parseImageUrl(
  image_url?: string | ImageUrl[]
): ImageUrl[] {
  if (!image_url) return [];

  if (Array.isArray(image_url)) return image_url;

  if (typeof image_url === "string") {
    try {
      return JSON.parse(image_url) as ImageUrl[];
    } catch {
      return [];
    }
  }

  return [];
}


export const getVariantImage = (image_url?: string | ImageUrl[]): string => {
  if (!image_url) return '';

  // Case 1: already a string
  if (typeof image_url === 'string') {
    return image_url;
  }

  // Case 2: ImageUrl[]
  if (Array.isArray(image_url) && image_url.length > 0) {
    return image_url[0].url ?? '';
  }

  return '';
};
