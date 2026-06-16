import { create } from 'zustand';
import type { Interview, Segment, Tag, TagCategory, InterviewStats, InterviewStatus } from '../../shared/types.js';

interface AppState {
  stats: InterviewStats | null;
  interviews: Interview[];
  interviewTotal: number;
  currentInterview: Interview | null;
  currentSegments: Segment[];
  tags: Record<TagCategory, Tag[]>;
  allTags: Tag[];
  isLoading: boolean;
  selectedSegmentId: number | null;
  currentTime: number;
  isPlaying: boolean;

  fetchStats: () => Promise<void>;
  fetchInterviews: (params?: {
    page?: number;
    pageSize?: number;
    status?: InterviewStatus;
    search?: string;
    tagIds?: number[];
  }) => Promise<void>;
  fetchRecentInterviews: (limit?: number) => Promise<void>;
  fetchInterviewDetail: (id: number) => Promise<void>;
  fetchTags: (category?: TagCategory) => Promise<void>;
  fetchAllTags: () => Promise<void>;
  createInterview: (data: { title: string; interviewee?: string; interviewer?: string }) => Promise<Interview>;
  updateSegmentText: (segmentId: number, text: string) => Promise<void>;
  updateSegmentTags: (segmentId: number, tagIds: number[]) => Promise<void>;
  createTag: (data: { name: string; category: TagCategory; color?: string }) => Promise<Tag>;

  setSelectedSegmentId: (id: number | null) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  stats: null,
  interviews: [],
  interviewTotal: 0,
  currentInterview: null,
  currentSegments: [],
  tags: { person: [], location: [], era: [], event: [] },
  allTags: [],
  isLoading: false,
  selectedSegmentId: null,
  currentTime: 0,
  isPlaying: false,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const { api } = await import('@/lib/api.js');
      const stats = await api.getStats();
      set({ stats });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchInterviews: async (params) => {
    set({ isLoading: true });
    try {
      const { api } = await import('@/lib/api.js');
      const result = await api.getInterviews(params);
      set({ interviews: result.interviews, interviewTotal: result.total });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRecentInterviews: async (limit = 5) => {
    try {
      const { api } = await import('@/lib/api.js');
      const interviews = await api.getRecentInterviews(limit);
      set({ interviews });
    } catch (e) {
      console.error('Failed to fetch recent interviews:', e);
    }
  },

  fetchInterviewDetail: async (id: number) => {
    set({ isLoading: true });
    try {
      const { api } = await import('@/lib/api.js');
      const detail = await api.getInterviewDetail(id);
      set({
        currentInterview: detail,
        currentSegments: detail.segments,
        selectedSegmentId: detail.segments[0]?.id || null,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTags: async (category) => {
    try {
      const { api } = await import('@/lib/api.js');
      const tags = await api.getTags(category);
      if (category) {
        set(state => ({
          tags: { ...state.tags, [category]: tags },
        }));
      }
    } catch (e) {
      console.error('Failed to fetch tags:', e);
    }
  },

  fetchAllTags: async () => {
    try {
      const { api } = await import('@/lib/api.js');
      const allTags = await api.getTags();
      const byCategory: Record<TagCategory, Tag[]> = {
        person: [],
        location: [],
        era: [],
        event: [],
      };
      for (const tag of allTags) {
        byCategory[tag.category].push(tag);
      }
      set({ allTags, tags: byCategory });
    } catch (e) {
      console.error('Failed to fetch all tags:', e);
    }
  },

  createInterview: async (data) => {
    const { api } = await import('@/lib/api.js');
    const interview = await api.createInterview(data);
    return interview;
  },

  updateSegmentText: async (segmentId: number, text: string) => {
    const { api } = await import('@/lib/api.js');
    const updated = await api.updateSegmentText(segmentId, text);
    set(state => ({
      currentSegments: state.currentSegments.map(s =>
        s.id === segmentId ? updated : s
      ),
    }));
  },

  updateSegmentTags: async (segmentId: number, tagIds: number[]) => {
    const { api } = await import('@/lib/api.js');
    const tags = await api.updateSegmentTags(segmentId, tagIds);
    set(state => ({
      currentSegments: state.currentSegments.map(s =>
        s.id === segmentId ? { ...s, tags } : s
      ),
    }));
  },

  createTag: async (data) => {
    const { api } = await import('@/lib/api.js');
    const tag = await api.createTag(data);
    set(state => ({
      allTags: [...state.allTags, tag],
      tags: {
        ...state.tags,
        [data.category]: [...state.tags[data.category], tag],
      },
    }));
    return tag;
  },

  setSelectedSegmentId: (id: number | null) => set({ selectedSegmentId: id }),
  setCurrentTime: (time: number) => set({ currentTime: time }),
  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
}));
