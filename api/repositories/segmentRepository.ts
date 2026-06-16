import db from '../db/database.js';
import type { Segment, Tag } from '../../shared/types.js';

function rowToSegment(row: any): Segment {
  return {
    id: row.id,
    interviewId: row.interview_id,
    startTime: row.start_time,
    endTime: row.end_time,
    text: row.text_content,
    originalText: row.original_text,
    isEdited: !!row.is_edited,
    orderIndex: row.order_index,
    tags: [],
  };
}

function rowToTag(row: any): Tag {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    color: row.color,
    usageCount: row.usage_count || 0,
  };
}

export function getSegmentById(id: number): (Segment & { tags: Tag[] }) | null {
  const sql = `
    SELECT s.*
    FROM segments s
    WHERE s.id = ?
  `;
  const row = db.prepare(sql).get(id) as any;
  if (!row) return null;

  const segment = rowToSegment(row);
  segment.tags = getSegmentTags(id);

  return segment as Segment & { tags: Tag[] };
}

export function getSegmentTags(segmentId: number): Tag[] {
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

export function updateSegmentText(id: number, text: string): (Segment & { tags: Tag[] }) | null {
  const sql = `
    UPDATE segments
    SET text_content = ?, is_edited = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const result = db.prepare(sql).run(text, id);
  if (result.changes === 0) return null;

  updateFtsIndex(id, text);

  return getSegmentById(id);
}

export function updateSegmentTags(segmentId: number, tagIds: number[]): Tag[] {
  const deleteSql = 'DELETE FROM segment_tags WHERE segment_id = ?';
  db.prepare(deleteSql).run(segmentId);

  if (tagIds.length > 0) {
    const insertSql = 'INSERT OR IGNORE INTO segment_tags (segment_id, tag_id) VALUES (?, ?)';
    const insertStmt = db.prepare(insertSql);
    const insertMany = db.transaction((ids: number[]) => {
      for (const tagId of ids) {
        insertStmt.run(segmentId, tagId);
      }
    });
    insertMany(tagIds);
  }

  return getSegmentTags(segmentId);
}

export function createSegments(interviewId: number, segments: Array<{ startTime: number; endTime: number; text: string }>): number {
  const insertSql = `
    INSERT INTO segments (interview_id, start_time, end_time, text_content, original_text, is_edited, order_index)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `;
  const insertStmt = db.prepare(insertSql);

  const insertFtsSql = 'INSERT INTO segments_fts (rowid, text_content) VALUES (?, ?)';
  const insertFtsStmt = db.prepare(insertFtsSql);

  let count = 0;
  const insertMany = db.transaction((segs: typeof segments) => {
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      const result = insertStmt.run(interviewId, seg.startTime, seg.endTime, seg.text, seg.text, i);
      insertFtsStmt.run(result.lastInsertRowid, seg.text);
      count++;
    }
  });
  insertMany(segments);

  return count;
}

function updateFtsIndex(segmentId: number, text: string): void {
  const deleteSql = 'DELETE FROM segments_fts WHERE rowid = ?';
  db.prepare(deleteSql).run(segmentId);

  const insertSql = 'INSERT INTO segments_fts (rowid, text_content) VALUES (?, ?)';
  db.prepare(insertSql).run(segmentId, text);
}

export function getSegmentsByInterviewId(interviewId: number): (Segment & { tags: Tag[] })[] {
  const sql = `
    SELECT s.*
    FROM segments s
    WHERE s.interview_id = ?
    ORDER BY s.order_index ASC, s.id ASC
  `;
  const rows = db.prepare(sql).all(interviewId) as any[];

  return rows.map(row => {
    const segment = rowToSegment(row);
    segment.tags = getSegmentTags(row.id);
    return segment as Segment & { tags: Tag[] };
  });
}

export function getSegmentsByTagId(tagId: number): (Segment & { tags: Tag[] })[] {
  const sql = `
    SELECT s.*
    FROM segments s
    JOIN segment_tags st ON s.id = st.segment_id
    WHERE st.tag_id = ?
    ORDER BY s.interview_id ASC, s.order_index ASC
  `;
  const rows = db.prepare(sql).all(tagId) as any[];

  return rows.map(row => {
    const segment = rowToSegment(row);
    segment.tags = getSegmentTags(row.id);
    return segment as Segment & { tags: Tag[] };
  });
}
