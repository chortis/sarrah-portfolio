// Shared domain model describing the Astro content collections.
// Mirrors src/content.config.ts in the portfolio site.

export type CollectionId =
  | 'portfolio'
  | 'private'
  | 'drawings'
  | 'private-drawings'

export type MediaKind = 'video' | 'image'

export interface CollectionDef {
  id: CollectionId
  label: string
  media: MediaKind
  isPrivate: boolean
  /** Path (relative to repo root) where markdown files for this collection live. */
  contentDir: string
  /** Cloudinary folder new uploads for this collection are placed in. */
  cloudinaryFolder: string
  /** Whether items in this collection support the lock/private toggle. */
  hasLock: boolean
  /** Whether video items support a YouTube URL instead of an upload. */
  allowsYouTube: boolean
}

export const COLLECTIONS: Record<CollectionId, CollectionDef> = {
  portfolio: {
    id: 'portfolio',
    label: 'Portfolio Videos',
    media: 'video',
    isPrivate: false,
    contentDir: 'src/content/portfolio',
    cloudinaryFolder: 'sarrah-folio',
    hasLock: true,
    allowsYouTube: false
  },
  private: {
    id: 'private',
    label: 'Client Work (Videos)',
    media: 'video',
    isPrivate: true,
    contentDir: 'src/content/private',
    cloudinaryFolder: 'sarrah-folio/client',
    hasLock: true,
    allowsYouTube: true
  },
  drawings: {
    id: 'drawings',
    label: 'Drawings',
    media: 'image',
    isPrivate: false,
    contentDir: 'src/content/drawings',
    cloudinaryFolder: 'sarrah-folio',
    hasLock: false,
    allowsYouTube: false
  },
  'private-drawings': {
    id: 'private-drawings',
    label: 'Client Work (Images)',
    media: 'image',
    isPrivate: true,
    contentDir: 'src/content/private-drawings',
    cloudinaryFolder: 'sarrah-folio/client',
    hasLock: false,
    allowsYouTube: false
  }
}

export const COLLECTION_LIST: CollectionDef[] = Object.values(COLLECTIONS)

/** Frontmatter shape for video collections (portfolio, private). */
export interface VideoFrontmatter {
  title: string
  description: string
  video: string
  poster?: string
  order: number
  lock: boolean
}

/** Frontmatter shape for image collections (drawings, private-drawings). */
export interface ImageFrontmatter {
  alt: string
  image: string
  order: number
  full: boolean
  /** Only present for private-drawings. */
  project?: string
  description?: string
}

export type Frontmatter = VideoFrontmatter | ImageFrontmatter

/** A content item as loaded from the repo. */
export interface ContentItem {
  /** Repo-relative path to the markdown file, e.g. src/content/portfolio/project-01.md */
  path: string
  /** Filename without extension, used as a stable id/slug. */
  slug: string
  collection: CollectionId
  data: Frontmatter
  /** Git blob SHA, needed to update/delete the file via the API. */
  sha: string
}
