export interface Artwork {
  id: string;
  slug: string;
  titleZh: string;
  titleOriginal: string;
  artist: string;
  artistZh: string;
  artistSlug: string;
  year: string;
  yearStart: number;
  yearEnd: number;
  movement: string;
  medium: string;
  dimensions: string;
  museum: string;
  museumUrl: string;
  imageUrl: string;
  thumbnailUrl: string;
  sourceUrl: string;
  imageSourceUrl: string;
  tags: string[];
  favorite: boolean;
  notes: string;
  aspectRatio: number;
  width: number;
  height: number;
  rights: string;
  alt: string;
}
export interface PersonalEntry {
  favorite?: boolean;
  liked?: boolean;
  notes?: string;
}
export type PersonalLibrary = Record<string, PersonalEntry>;
