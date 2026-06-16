import db from '../db/database.js';
import type { Tag, TagCategory, CreateTagRequest, UpdateTagRequest } from '../../shared/types.js';

function rowToTag(row: any): Tag {
  return {
    id: row.id,
    name: row.name,
    category: row.category as TagCategory,
    color: row.color || '#888888',
    usageCount: row.usage_count || 0,
  };
}

const defaultColors: Record<TagCategory, string[]> = {
  person: ['#e74c3c', '#3498db', '#9b59b6', '#1abc9c', '#f39c12', '#e67e22', '#34495e'],
  location: ['#2ecc71', '#16a085', '#27ae60', '#2980b9', '#3498db', '#9b59b6', '#8e44ad'],
  era: ['#95a5a6', '#7f8c8d', '#bdc3c7', '#f1c40f', '#f39c12', '#e67e22', '#d35400'],
  event: ['#c0392b', '#e74c3c', '#f1c40f', '#f39c12', '#16a085', '#27ae60', '#2980b9'],
};

function getRandomColor(category: TagCategory): string {
  const colors = defaultColors[category] || defaultColors.person;
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getTags(category?: TagCategory): Tag[] {
  let sql = `
    SELECT t.*, (
      SELECT COUNT(*) FROM segment_tags st WHERE st.tag_id = t.id
    ) as usage_count
    FROM tags t
  `;
  const params: any[] = [];

  if (category) {
    sql += ' WHERE t.category = ?';
    params.push(category);
  }

  sql += ' ORDER BY t.name ASC';

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map(rowToTag);
}

export function getTagById(id: number): Tag | null {
  const sql = `
    SELECT t.*, (
      SELECT COUNT(*) FROM segment_tags st WHERE st.tag_id = t.id
    ) as usage_count
    FROM tags t
    WHERE t.id = ?
  `;
  const row = db.prepare(sql).get(id) as any;
  return row ? rowToTag(row) : null;
}

export function getTagByName(name: string): Tag | null {
  const sql = `
    SELECT t.*, (
      SELECT COUNT(*) FROM segment_tags st WHERE st.tag_id = t.id
    ) as usage_count
    FROM tags t
    WHERE t.name = ?
  `;
  const row = db.prepare(sql).get(name) as any;
  return row ? rowToTag(row) : null;
}

export function createTag(data: CreateTagRequest): Tag {
  const color = data.color || getRandomColor(data.category);
  const sql = 'INSERT INTO tags (name, category, color) VALUES (?, ?, ?)';
  const result = db.prepare(sql).run(data.name, data.category, color);

  const tag = getTagById(result.lastInsertRowid as number);
  return tag!;
}

export function updateTag(id: number, data: UpdateTagRequest): Tag | null {
  const fields: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    params.push(data.name);
  }
  if (data.color !== undefined) {
    fields.push('color = ?');
    params.push(data.color);
  }

  if (fields.length === 0) {
    return getTagById(id);
  }

  params.push(id);

  const sql = `
    UPDATE tags
    SET ${fields.join(', ')}
    WHERE id = ?
  `;
  db.prepare(sql).run(...params);

  return getTagById(id);
}

export function deleteTag(id: number): boolean {
  const sql = 'DELETE FROM tags WHERE id = ?';
  const result = db.prepare(sql).run(id);
  return result.changes > 0;
}

export function mergeTags(sourceTagId: number, targetTagId: number): boolean {
  const sourceTag = getTagById(sourceTagId);
  const targetTag = getTagById(targetTagId);

  if (!sourceTag || !targetTag) return false;

  const updateSql = `
    UPDATE OR IGNORE segment_tags
    SET tag_id = ?
    WHERE tag_id = ?
  `;
  db.prepare(updateSql).run(targetTagId, sourceTagId);

  deleteTag(sourceTagId);

  return true;
}

export function searchTags(query: string, category?: TagCategory, limit: number = 10): Tag[] {
  let sql = `
    SELECT t.*, (
      SELECT COUNT(*) FROM segment_tags st WHERE st.tag_id = t.id
    ) as usage_count
    FROM tags t
    WHERE t.name LIKE ?
  `;
  const params: any[] = [`%${query}%`];

  if (category) {
    sql += ' AND t.category = ?';
    params.push(category);
  }

  sql += ' ORDER BY t.name ASC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map(rowToTag);
}
