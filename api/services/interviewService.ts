import * as interviewRepository from '../repositories/interviewRepository.js';
import { getSegmentsByInterviewId, createSegments } from '../repositories/segmentRepository.js';
import type { Interview, InterviewDetail, CreateInterviewRequest, InterviewStatus } from '../../shared/types.js';

export function getInterviews(query: interviewRepository.InterviewQuery = {}): { interviews: Interview[]; total: number } {
  return interviewRepository.getInterviews(query);
}

export function getInterviewById(id: number): Interview | null {
  return interviewRepository.getInterviewById(id);
}

export function getInterviewDetail(id: number): InterviewDetail | null {
  return interviewRepository.getInterviewDetail(id);
}

export function createInterview(data: CreateInterviewRequest): Interview {
  return interviewRepository.createInterview(data);
}

export function updateInterview(id: number, data: Partial<CreateInterviewRequest> & { status?: InterviewStatus; audioPath?: string; duration?: number }): Interview | null {
  return interviewRepository.updateInterview(id, data);
}

export function deleteInterview(id: number): boolean {
  return interviewRepository.deleteInterview(id);
}

export function getRecentInterviews(limit: number = 5): Interview[] {
  return interviewRepository.getRecentInterviews(limit);
}

export function importTranscript(interviewId: number, text: string): number {
  const segments = parseTranscript(text);

  const existingSegments = getSegmentsByInterviewId(interviewId);
  if (existingSegments.length > 0) {
    return 0;
  }

  return createSegments(interviewId, segments);
}

function parseTranscript(text: string): Array<{ startTime: number; endTime: number; text: string }> {
  const lines = text.split('\n').filter(line => line.trim());
  const segments: Array<{ startTime: number; endTime: number; text: string }> = [];

  let currentTime = 0;
  let currentText = '';
  const avgCharPerSecond = 4;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const timeMatch = line.match(/\[?(\d{1,2}):(\d{2})(?::(\d{2}))?\]?/);
    if (timeMatch) {
      if (currentText) {
        const duration = Math.max(currentText.length / avgCharPerSecond, 5);
        segments.push({
          startTime: currentTime,
          endTime: currentTime + duration,
          text: currentText.trim(),
        });
      }

      const hours = timeMatch[3] ? parseInt(timeMatch[1]) : 0;
      const minutes = timeMatch[3] ? parseInt(timeMatch[2]) : parseInt(timeMatch[1]);
      const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : parseInt(timeMatch[2]);
      currentTime = hours * 3600 + minutes * 60 + seconds;
      currentText = '';
    } else {
      currentText += (currentText ? ' ' : '') + line;
    }
  }

  if (currentText) {
    const duration = Math.max(currentText.length / avgCharPerSecond, 5);
    segments.push({
      startTime: currentTime,
      endTime: currentTime + duration,
      text: currentText.trim(),
    });
  }

  if (segments.length === 0 && text.trim()) {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    if (paragraphs.length > 1) {
      let time = 0;
      for (const para of paragraphs) {
        const cleanPara = para.trim();
        const duration = Math.max(cleanPara.length / avgCharPerSecond, 8);
        segments.push({
          startTime: time,
          endTime: time + duration,
          text: cleanPara,
        });
        time += duration;
      }
    } else {
      const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim());
      let time = 0;
      for (const sentence of sentences) {
        const cleanSentence = sentence.trim();
        if (!cleanSentence) continue;
        const duration = Math.max(cleanSentence.length / avgCharPerSecond, 3);
        segments.push({
          startTime: time,
          endTime: time + duration,
          text: cleanSentence,
        });
        time += duration;
      }
    }
  }

  if (segments.length === 0) {
    segments.push({
      startTime: 0,
      endTime: 60,
      text: text.trim() || '（暂无文本）',
    });
  }

  return segments;
}
