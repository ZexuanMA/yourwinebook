import type { Metadata } from "next";
import { getPostById } from "@/lib/community-store";
import PostDetailClient from "./PostDetailClient";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const post = await getPostById(id);
  if (!post) {
    return { title: locale === "zh-HK" ? "找不到帖子" : "Post Not Found" };
  }

  const title = `${post.title} — Your Wine Book`;
  const description = post.content.slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "Your Wine Book",
      url: `https://yourwinebook.com/${locale}/community/${id}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <PostDetailClient id={id} />;
}
