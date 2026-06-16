import * as searchRepository from '../repositories/searchRepository.js';
import type { SearchResult, InterviewStats, TagCategory } from '../../shared/types.js';

export interface SearchParams {
  q: string;
  page?: number;
  pageSize?: number;
  tagIds?: number[];
  categories?: TagCategory[];
  type?: 'all' | 'segment' | 'interview';
}

export function search(params: SearchParams): { results: SearchResult[]; total: number } {
  const { type = 'all', ...rest } = params;

  if (type === 'segment' || type === 'all') {
    return searchRepository.searchSegments(rest);
  }

  return searchRepository.searchInterviews(rest);
}

export function searchSegments(params: Omit<SearchParams, 'type'>): { results: SearchResult[]; total: number } {
  return searchRepository.searchSegments(params);
}

export function searchInterviews(params: Omit<SearchParams, 'type'>): { results: SearchResult[]; total: number } {
  return searchRepository.searchInterviews(params);
}

export function getStats(): InterviewStats {
  return searchRepository.getStats();
}

export function getPersonDetail(tagId: number) {
  return searchRepository.getPersonDetail(tagId);
}
