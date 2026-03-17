// Author type
export type AuthorType = "user" | "merchant";

// Community post
export interface CommunityPost {
  id: string;
  authorId: string;
  authorType: AuthorType;
  authorName: string;
  title: string;
  content: string;
  wineSlug?: string;
  wineName?: string;
  rating?: number; // 1-5
  tags: string[];
  likes: string[]; // user/merchant IDs
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

// Community comment
export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  authorType: AuthorType;
  authorName: string;
  content: string;
  createdAt: string;
}
