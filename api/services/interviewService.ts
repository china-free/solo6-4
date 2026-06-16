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
  const avgCharPerSecond = 4;

  interface RawSegment {
    startTime: number;
    text: string;
  }

  const rawSegments: RawSegment[] = [];
  const lines = text.split('\n');

  let currentTime: number | null = null;
  let currentText = '';

  function parseTimestamp(timeStr: string): number | null {
    timeStr = timeStr.trim();
    timeStr = timeStr.replace(/^\[|\]$/g, '');

    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      if (!isNaN(minutes) && !isNaN(seconds) && minutes >= 0 && seconds >= 0 && seconds < 60) {
        return minutes * 60 + seconds;
      }
    } else if (parts.length === 3) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseInt(parts[2], 10);
      if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds) && minutes >= 0 && minutes < 60 && seconds >= 0 && seconds < 60) {
        return hours * 3600 + minutes * 60 + seconds;
      }
    }
    return null;
  }

  function finalizeSegment() {
    if (currentTime !== null && currentText.trim()) {
      rawSegments.push({
        startTime: currentTime,
        text: currentText.trim(),
      });
    }
    currentText = '';
  }

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      if (currentText) {
        currentText += '\n';
      }
      continue;
    }

    const timestampRegex = /^\s*\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*/;
    const match = trimmedLine.match(timestampRegex);

    if (match) {
      const timestampStr = match[1];
      const parsedTime = parseTimestamp(timestampStr);

      if (parsedTime !== null) {
        finalizeSegment();

        currentTime = parsedTime;
        const remainingText = trimmedLine.substring(match[0].length).trim();

        if (remainingText) {
          currentText = remainingText;
        }
      } else {
        if (currentTime !== null) {
          currentText += (currentText ? ' ' : '') + trimmedLine;
        }
      }
    } else {
      if (currentTime !== null) {
        if (currentText && !currentText.endsWith('\n')) {
          currentText += ' ';
        }
        currentText += trimmedLine;
      }
    }
  }

  finalizeSegment();

  if (rawSegments.length > 0) {
    const segments: Array<{ startTime: number; endTime: number; text: string }> = [];

    for (let i = 0; i < rawSegments.length; i++) {
      const current = rawSegments[i];
      let endTime: number;

      if (i < rawSegments.length - 1) {
        endTime = rawSegments[i + 1].startTime;
      } else {
        const duration = Math.max(current.text.length / avgCharPerSecond, 5);
        endTime = current.startTime + duration;
      }

      if (endTime <= current.startTime) {
        const duration = Math.max(current.text.length / avgCharPerSecond, 5);
        endTime = current.startTime + duration;
      }

      segments.push({
        startTime: current.startTime,
        endTime,
        text: current.text,
      });
    }

    return segments;
  }

  const segments: Array<{ startTime: number; endTime: number; text: string }> = [];
  const trimmedText = text.trim();

  if (!trimmedText) {
    segments.push({
      startTime: 0,
      endTime: 60,
      text: '（暂无文本）',
    });
    return segments;
  }

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
    return segments;
  }

  const sentences = text.split(/([。！？.!?]+)/).filter(s => s.trim());
  if (sentences.length > 1) {
    let time = 0;
    for (let i = 0; i < sentences.length; i += 2) {
      if (i + 1 < sentences.length) {
        const cleanSentence = (sentences[i] + sentences[i + 1]).trim();
        const duration = Math.max(cleanSentence.length / avgCharPerSecond, 3);
        segments.push({
          startTime: time,
          endTime: time + duration,
          text: cleanSentence,
        });
        time += duration;
      } else if (sentences[i].trim()) {
        const cleanSentence = sentences[i].trim();
        const duration = Math.max(cleanSentence.length / avgCharPerSecond, 3);
        segments.push({
          startTime: time,
          endTime: time + duration,
          text: cleanSentence,
        });
      }
    }
    return segments;
  }

  segments.push({
    startTime: 0,
    endTime: Math.max(trimmedText.length / avgCharPerSecond, 60),
    text: trimmedText,
  });

  return segments;
}
