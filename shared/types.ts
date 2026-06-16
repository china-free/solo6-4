export type TagCategory = 'person' | 'location' | 'era' | 'event';

export interface Tag {
  id: number;
  name: string;
  category: TagCategory;
  color: string;
  usageCount: number;
}

export interface Segment {
  id: number;
  interviewId: number;
  startTime: number;
  endTime: number;
  text: string;
  originalText: string;
  isEdited: boolean;
  orderIndex: number;
  tags: Tag[];
}

export type InterviewStatus = 'draft' | 'editing' | 'completed';

export interface Interview {
  id: number;
  title: string;
  interviewee: string;
  interviewer: string;
  interviewDate: string | null;
  duration: number;
  audioUrl: string | null;
  status: InterviewStatus;
  segmentCount: number;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

export interface InterviewDetail extends Interview {
  segments: Segment[];
}

export interface InterviewStats {
  totalInterviews: number;
  totalSegments: number;
  totalPersonTags: number;
  totalLocationTags: number;
  completedInterviews: number;
  editingInterviews: number;
}

export interface SearchResult {
  type: 'interview' | 'segment';
  id: number;
  interviewId: number;
  interviewTitle: string;
  highlightText: string;
  matchedTags: Tag[];
  startTime?: number;
}

export interface PersonDetail {
  id: number;
  name: string;
  aliases: string[];
  birthYear: number | null;
  deathYear: number | null;
  description: string;
  relatedSegments: Segment[];
  relatedPeople: { id: number; name: string; interviewCount: number }[];
}

export interface CreateInterviewRequest {
  title: string;
  interviewee?: string;
  interviewer?: string;
  interviewDate?: string;
}

export interface UpdateSegmentRequest {
  text: string;
}

export interface UpdateSegmentTagsRequest {
  tagIds: number[];
}

export interface CreateTagRequest {
  name: string;
  category: TagCategory;
  color?: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
}

export interface MergeTagsRequest {
  sourceTagId: number;
  targetTagId: number;
}
