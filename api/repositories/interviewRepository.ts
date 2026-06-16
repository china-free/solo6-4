import db from '../db/database.js';
import type { Interview, InterviewDetail, InterviewStatus, CreateInterviewRequest } from '../../shared/types.js';

function rowToInterview(row: any): Interview {
  return {
    id: row.id,
    title: row.title,
    interviewee: row.interviewee || '',
    interviewer: row.interviewer || '',
    interviewDate: row.interview_date,
    duration: row.duration || 0,
    audioUrl: row.audio_path,
    status: row.status as InterviewStatus,
    segmentCount: row.segment_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface InterviewQuery {
  page?: number;
  pageSize?: number;
  status?: InterviewStatus;
  search?: string;
  tagIds?: number[];
}

export function getInterviews(query: InterviewQuery = {}): { interviews: Interview[]; total: number } {
  const { page = 1, pageSize = 20, status, search, tagIds = [] } = query;
  const offset = (page - 1) * pageSize;

  let whereClauses: string[] = [];
  let params: any[] = [];

  if (status) {
    whereClauses.push('i.status = ?');
    params.push(status);
  }

  if (search) {
    whereClauses.push('(i.title LIKE ? OR i.interviewee LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
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
  const totalRow = db.prepare(countSql).get(...params) as { count: number };
  const total = totalRow.count;

  const sql = `
    SELECT i.*, (
      SELECT COUNT(*) FROM segments s WHERE s.interview_id = i.id
    ) as segment_count
    FROM interviews i
    ${whereSql}
    ORDER BY i.updated_at DESC
    LIMIT ? OFFSET ?
  `;
  const rows = db.prepare(sql).all(...params, pageSize, offset) as any[];

  const interviews = rows.map(rowToInterview);
  return { interviews, total };
}

export function getInterviewById(id: number): Interview | null {
  const sql = `
    SELECT i.*, (
      SELECT COUNT(*) FROM segments s WHERE s.interview_id = i.id
    ) as segment_count
    FROM interviews i
    WHERE i.id = ?
  `;
  const row = db.prepare(sql).get(id) as any;
  return row ? rowToInterview(row) : null;
}

export function getInterviewDetail(id: number): InterviewDetail | null {
  const interview = getInterviewById(id);
  if (!interview) return null;

  const segmentsSql = `
    SELECT s.*, 
           GROUP_CONCAT(t.id, ',') as tag_ids,
           GROUP_CONCAT(t.name, ',') as tag_names,
           GROUP_CONCAT(t.category, ',') as tag_categories,
           GROUP_CONCAT(t.color, ',') as tag_colors
    FROM segments s
    LEFT JOIN segment_tags st ON s.id = st.segment_id
    LEFT JOIN tags t ON st.tag_id = t.id
    WHERE s.interview_id = ?
    GROUP BY s.id
    ORDER BY s.order_index ASC, s.id ASC
  `;
  const segmentRows = db.prepare(segmentsSql).all(id) as any[];

  const segments = segmentRows.map(row => {
    const tags: Array<{ id: number; name: string; category: import('../../shared/types.js').TagCategory; color: string; usageCount: number }> = [];
    if (row.tag_ids) {
      const ids = row.tag_ids.split(',');
      const names = row.tag_names.split(',');
      const categories = row.tag_categories.split(',');
      const colors = row.tag_colors.split(',');
      for (let i = 0; i < ids.length; i++) {
        tags.push({
          id: parseInt(ids[i]),
          name: names[i],
          category: categories[i] as import('../../shared/types.js').TagCategory,
          color: colors[i],
          usageCount: 0,
        });
      }
    }

    return {
      id: row.id,
      interviewId: row.interview_id,
      startTime: row.start_time,
      endTime: row.end_time,
      text: row.text_content,
      originalText: row.original_text,
      isEdited: !!row.is_edited,
      orderIndex: row.order_index,
      tags,
    };
  });

  return {
    ...interview,
    segments,
  };
}

export function createInterview(data: CreateInterviewRequest): Interview {
  const sql = `
    INSERT INTO interviews (title, interviewee, interviewer, interview_date)
    VALUES (?, ?, ?, ?)
  `;
  const result = db.prepare(sql).run(
    data.title,
    data.interviewee || null,
    data.interviewer || null,
    data.interviewDate || null
  );

  const interview = getInterviewById(result.lastInsertRowid as number);
  return interview!;
}

export function updateInterview(id: number, data: Partial<CreateInterviewRequest> & { status?: InterviewStatus; audioPath?: string; duration?: number }): Interview | null {
  const fields: string[] = [];
  const params: any[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    params.push(data.title);
  }
  if (data.interviewee !== undefined) {
    fields.push('interviewee = ?');
    params.push(data.interviewee || null);
  }
  if (data.interviewer !== undefined) {
    fields.push('interviewer = ?');
    params.push(data.interviewer || null);
  }
  if (data.interviewDate !== undefined) {
    fields.push('interview_date = ?');
    params.push(data.interviewDate || null);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }
  if (data.audioPath !== undefined) {
    fields.push('audio_path = ?');
    params.push(data.audioPath || null);
  }
  if (data.duration !== undefined) {
    fields.push('duration = ?');
    params.push(data.duration);
  }

  if (fields.length === 0) {
    return getInterviewById(id);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  const sql = `
    UPDATE interviews
    SET ${fields.join(', ')}
    WHERE id = ?
  `;
  db.prepare(sql).run(...params);

  return getInterviewById(id);
}

export function deleteInterview(id: number): boolean {
  const sql = 'DELETE FROM interviews WHERE id = ?';
  const result = db.prepare(sql).run(id);
  return result.changes > 0;
}

export function getRecentInterviews(limit: number = 5): Interview[] {
  const sql = `
    SELECT i.*, (
      SELECT COUNT(*) FROM segments s WHERE s.interview_id = i.id
    ) as segment_count
    FROM interviews i
    ORDER BY i.updated_at DESC
    LIMIT ?
  `;
  const rows = db.prepare(sql).all(limit) as any[];
  return rows.map(rowToInterview);
}
