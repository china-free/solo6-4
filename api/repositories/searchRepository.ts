import db from '../db/database.js';
import type { SearchResult, Tag, TagCategory, InterviewStats } from '../../shared/types.js';

function rowToTag(row: any): Tag {
  return {
    id: row.id,
    name: row.name,
    category: row.category as TagCategory,
    color: row.color || '#888888',
    usageCount: row.usage_count || 0,
  };
}

export interface SearchQuery {
  q: string;
  page?: number;
  pageSize?: number;
  tagIds?: number[];
  categories?: TagCategory[];
}

export function searchSegments(query: SearchQuery): { results: SearchResult[]; total: number } {
  const { q, page = 1, pageSize = 20, tagIds = [], categories = [] } = query;
  const offset = (page - 1) * pageSize;

  if (!q && tagIds.length === 0 && categories.length === 0) {
    return { results: [], total: 0 };
  }

  let whereClauses: string[] = [];
  let params: any[] = [];

  if (q) {
    whereClauses.push('s_fts MATCH ?');
    params.push(q + '*');
  }

  if (tagIds.length > 0) {
    whereClauses.push(`
      s.id IN (
        SELECT segment_id FROM segment_tags WHERE tag_id IN (${tagIds.map(() => '?').join(',')})
      )
    `);
    params.push(...tagIds);
  }

  if (categories.length > 0) {
    whereClauses.push(`
      s.id IN (
        SELECT st.segment_id 
        FROM segment_tags st
        JOIN tags t ON st.tag_id = t.id
        WHERE t.category IN (${categories.map(() => '?').join(',')})
      )
    `);
    params.push(...categories);
  }

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const countSql = `
    SELECT COUNT(DISTINCT s.id) as count
    FROM segments_fts s_fts
    JOIN segments s ON s_fts.rowid = s.id
    ${whereSql}
  `;
  const countRow = db.prepare(countSql).get(...params) as { count: number };
  const total = countRow.count;

  const sql = `
    SELECT s.*, i.title as interview_title, i.id as interview_id,
           snippet(s_fts, 0, '<mark>', '</mark>', '...', 64) as highlight_text
    FROM segments_fts s_fts
    JOIN segments s ON s_fts.rowid = s.id
    JOIN interviews i ON s.interview_id = i.id
    ${whereSql}
    ORDER BY s_fts.rank
    LIMIT ? OFFSET ?
  `;

  let rows: any[];
  if (q) {
    rows = db.prepare(sql).all(...params, pageSize, offset) as any[];
  } else {
    const noFtsSql = `
      SELECT s.*, i.title as interview_title, i.id as interview_id,
             s.text_content as highlight_text
      FROM segments s
      JOIN interviews i ON s.interview_id = i.id
      ${whereSql}
      ORDER BY s.updated_at DESC
      LIMIT ? OFFSET ?
    `;
    rows = db.prepare(noFtsSql).all(...params, pageSize, offset) as any[];
  }

  const results = rows.map(row => {
    const tags = getSegmentTags(row.id);
    return {
      type: 'segment' as const,
      id: row.id,
      interviewId: row.interview_id,
      interviewTitle: row.interview_title,
      highlightText: row.highlight_text,
      matchedTags: tags,
      startTime: row.start_time,
    };
  });

  return { results, total };
}

function getSegmentTags(segmentId: number): Tag[] {
  const sql = `
    SELECT t.*, (
      SELECT COUNT(*) FROM segment_tags st2 WHERE st2.tag_id = t.id
    ) as usage_count
    FROM tags t
    JOIN segment_tags st ON t.id = st.tag_id
    WHERE st.segment_id = ?
    ORDER BY t.name ASC
  `;
  const rows = db.prepare(sql).all(segmentId) as any[];
  return rows.map(rowToTag);
}

export function searchInterviews(query: SearchQuery): { results: SearchResult[]; total: number } {
  const { q, page = 1, pageSize = 20, tagIds = [] } = query;
  const offset = (page - 1) * pageSize;

  if (!q && tagIds.length === 0) {
    return { results: [], total: 0 };
  }

  let whereClauses: string[] = [];
  let params: any[] = [];

  if (q) {
    whereClauses.push('(i.title LIKE ? OR i.interviewee LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }

  if (tagIds.length > 0) {
    whereClauses.push(`
      i.id IN (
        SELECT DISTINCT s.interview_id 
        FROM segments s
        JOIN segment_tags st ON s.id = st.segment_id
        WHERE st.tag_id IN (${tagIds.map(() => '?').join(',')})
      )
    `);
    params.push(...tagIds);
  }

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const countSql = `
    SELECT COUNT(DISTINCT i.id) as count
    FROM interviews i
    ${whereSql}
  `;
  const countRow = db.prepare(countSql).get(...params) as { count: number };
  const total = countRow.count;

  const sql = `
    SELECT i.*, (
      SELECT s.text_content 
      FROM segments s 
      WHERE s.interview_id = i.id 
      ORDER BY s.order_index ASC 
      LIMIT 1
    ) as snippet_text
    FROM interviews i
    ${whereSql}
    ORDER BY i.updated_at DESC
    LIMIT ? OFFSET ?
  `;
  const rows = db.prepare(sql).all(...params, pageSize, offset) as any[];

  const results = rows.map(row => {
    const highlightText = row.snippet_text ? row.snippet_text.substring(0, 200) + '...' : '';
    return {
      type: 'interview' as const,
      id: row.id,
      interviewId: row.id,
      interviewTitle: row.title,
      highlightText,
      matchedTags: [],
    };
  });

  return { results, total };
}

export function getStats(): InterviewStats {
  const totalInterviewsRow = db.prepare('SELECT COUNT(*) as count FROM interviews').get() as { count: number };
  const totalSegmentsRow = db.prepare('SELECT COUNT(*) as count FROM segments').get() as { count: number };
  const totalPersonTagsRow = db.prepare("SELECT COUNT(*) as count FROM tags WHERE category = 'person'").get() as { count: number };
  const totalLocationTagsRow = db.prepare("SELECT COUNT(*) as count FROM tags WHERE category = 'location'").get() as { count: number };
  const completedRow = db.prepare("SELECT COUNT(*) as count FROM interviews WHERE status = 'completed'").get() as { count: number };
  const editingRow = db.prepare("SELECT COUNT(*) as count FROM interviews WHERE status = 'editing'").get() as { count: number };

  return {
    totalInterviews: totalInterviewsRow.count,
    totalSegments: totalSegmentsRow.count,
    totalPersonTags: totalPersonTagsRow.count,
    totalLocationTags: totalLocationTagsRow.count,
    completedInterviews: completedRow.count,
    editingInterviews: editingRow.count,
  };
}

export function getPersonDetail(tagId: number): any {
  const tagSql = `
    SELECT t.*, (
      SELECT COUNT(*) FROM segment_tags st WHERE st.tag_id = t.id
    ) as usage_count
    FROM tags t
    WHERE t.id = ? AND t.category = 'person'
  `;
  const tagRow = db.prepare(tagSql).get(tagId) as any;
  if (!tagRow) return null;

  const segmentsSql = `
    SELECT s.*, i.title as interview_title
    FROM segments s
    JOIN segment_tags st ON s.id = st.segment_id
    JOIN interviews i ON s.interview_id = i.id
    WHERE st.tag_id = ?
    ORDER BY i.interview_date DESC, s.order_index ASC
  `;
  const segmentRows = db.prepare(segmentsSql).all(tagId) as any[];

  const relatedPeopleSql = `
    SELECT t2.id, t2.name, COUNT(DISTINCT s.interview_id) as interview_count
    FROM tags t1
    JOIN segment_tags st1 ON t1.id = st1.tag_id
    JOIN segments s ON st1.segment_id = s.id
    JOIN segment_tags st2 ON s.id = st2.segment_id
    JOIN tags t2 ON st2.tag_id = t2.id
    WHERE t1.id = ? AND t2.category = 'person' AND t2.id != t1.id
    GROUP BY t2.id, t2.name
    ORDER BY interview_count DESC
    LIMIT 10
  `;
  const relatedPeopleRows = db.prepare(relatedPeopleSql).all(tagId) as any[];

  const segments = segmentRows.map(row => ({
    id: row.id,
    interviewId: row.interview_id,
    startTime: row.start_time,
    endTime: row.end_time,
    text: row.text_content,
    originalText: row.original_text,
    isEdited: !!row.is_edited,
    orderIndex: row.order_index,
    interviewTitle: row.interview_title,
    tags: [],
  }));

  return {
    id: tagRow.id,
    name: tagRow.name,
    aliases: [],
    birthYear: null,
    deathYear: null,
    description: '',
    relatedSegments: segments,
    relatedPeople: relatedPeopleRows.map(row => ({
      id: row.id,
      name: row.name,
      interviewCount: row.interview_count,
    })),
  };
}
