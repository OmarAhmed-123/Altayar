/**
 * Comment Service
 * Uses the unified API client
 */
import { API } from './apiClient';

export const commentService = {
  addComment: API.comment.addComment,
  getCommentsByResource: API.comment.getCommentsByResource,
  deleteComment: API.comment.deleteComment,
};

