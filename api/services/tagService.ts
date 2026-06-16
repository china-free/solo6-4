import * as tagRepository from '../repositories/tagRepository.js';
import type { Tag, TagCategory, CreateTagRequest, UpdateTagRequest } from '../../shared/types.js';

export function getTags(category?: TagCategory): Tag[] {
  return tagRepository.getTags(category);
}

export function getTagById(id: number): Tag | null {
  return tagRepository.getTagById(id);
}

export function getTagByName(name: string): Tag | null {
  return tagRepository.getTagByName(name);
}

export function createTag(data: CreateTagRequest): Tag {
  const existing = tagRepository.getTagByName(data.name);
  if (existing) {
    return existing;
  }
  return tagRepository.createTag(data);
}

export function updateTag(id: number, data: UpdateTagRequest): Tag | null {
  return tagRepository.updateTag(id, data);
}

export function deleteTag(id: number): boolean {
  return tagRepository.deleteTag(id);
}

export function mergeTags(sourceTagId: number, targetTagId: number): boolean {
  return tagRepository.mergeTags(sourceTagId, targetTagId);
}

export function searchTags(query: string, category?: TagCategory, limit: number = 10): Tag[] {
  return tagRepository.searchTags(query, category, limit);
}
