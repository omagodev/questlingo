export const getApiUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
  // Remove leading slash from path if it has one, or ensure it's structured properly
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const getMediaUrl = (url?: string | null): string => {
  if (!url) return "";

  // If it's already an absolute URL or a data URI, return it
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url;
  }

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
};
