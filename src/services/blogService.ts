/**
 * Blog Service
 * Uses the unified API client
 */
import { API } from './apiClient';

export interface BlogQueryParams {
  search?: string;
  category?: string;
  destination?: string;
  isReel?: boolean;
  mediaType?: string;
}

export interface CreateBlogPayload {
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  isReel?: boolean;
  category?: string;
  destination?: string;
  tags?: string[];
}

export const blogService = {
  getBlogs: (params?: BlogQueryParams) => API.blog.getBlogs(params),
  getBlogById: API.blog.getBlogById,
  likeBlog: API.blog.likeBlog,
  createBlog: (payload: CreateBlogPayload) => API.blog.createBlog(payload),
};

