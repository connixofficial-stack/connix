import type { FunctionReturnType } from 'convex/server';
import type { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';

export type TrustPagePost = Exclude<FunctionReturnType<typeof api.posts.getById>, null>;

export const getTrustPagePost = async (postId: Id<'posts'>) => {
  const client = getConvexClient();
  return client.query(api.posts.getById, { id: postId });
};

export const isTrustPostVisible = (post: TrustPagePost) =>
  post.status === 'Published' && (!post.publishedAt || post.publishedAt <= Date.now());
