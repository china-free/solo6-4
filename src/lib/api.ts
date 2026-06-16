import type {
  Interview,
  InterviewDetail,
  Segment,
  Tag,
  TagCategory,
  InterviewStats,
  SearchResult,
  CreateInterviewRequest,
  InterviewStatus,
  PersonDetail,
} from '../../shared/types.js';

const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  const data = await res.json();
  if (data.success === false) {
    throw new Error(data.error || 'Request failed');
  }
  return data.data;
}

export const api = {
  getStats: (): Promise<InterviewStats> => request('/stats'),

  getInterviews: (params?: {
    page?: number;
    pageSize?: number;
    status?: InterviewStatus;
    search?: string;
    tagIds?: number[];
  }): Promise<{ interviews: Interview[]; total: number }> => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.tagIds?.length) query.set('tagIds', params.tagIds.join(','));
    return request(`/interviews?${query.toString()}`);
  },

  getRecentInterviews: (limit?: number): Promise<Interview[]> => {
    const query = limit ? `?limit=${limit}` : '';
    return request(`/interviews/recent${query}`);
  },

  getInterview: (id: number): Promise<Interview> => request(`/interviews/${id}`),

  getInterviewDetail: (id: number): Promise<InterviewDetail> =>
    request(`/interviews/${id}?include=segments`),

  createInterview: (data: CreateInterviewRequest): Promise<Interview> =>
    request('/interviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateInterview: (
    id: number,
    data: Partial<CreateInterviewRequest> & { status?: InterviewStatus }
  ): Promise<Interview> =>
    request(`/interviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteInterview: (id: number): Promise<void> =>
    request(`/interviews/${id}`, { method: 'DELETE' }),

  uploadAudio: (id: number, file: File): Promise<Interview> => {
    const formData = new FormData();
    formData.append('audio', file);
    return request(`/interviews/${id}/audio`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  importTranscript: (id: number, text: string): Promise<{ importedCount: number }> =>
    request(`/interviews/${id}/import`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  getSegment: (id: number): Promise<Segment> => request(`/segments/${id}`),

  updateSegmentText: (id: number, text: string): Promise<Segment> =>
    request(`/segments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ text }),
    }),

  updateSegmentTags: (segmentId: number, tagIds: number[]): Promise<Tag[]> =>
    request(`/segments/${segmentId}/tags`, {
      method: 'PUT',
      body: JSON.stringify({ tagIds }),
    }),

  getTags: (category?: TagCategory): Promise<Tag[]> => {
    const query = category ? `?category=${category}` : '';
    return request(`/tags${query}`);
  },

  searchTags: (query: string, category?: TagCategory): Promise<Tag[]> => {
    const params = new URLSearchParams({ search: query });
    if (category) params.set('category', category);
    return request(`/tags?${params.toString()}`);
  },

  createTag: (data: { name: string; category: TagCategory; color?: string }): Promise<Tag> =>
    request('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTag: (id: number, data: { name?: string; color?: string }): Promise<Tag> =>
    request(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTag: (id: number): Promise<void> =>
    request(`/tags/${id}`, { method: 'DELETE' }),

  mergeTags: (sourceTagId: number, targetTagId: number): Promise<void> =>
    request('/tags/merge', {
      method: 'POST',
      body: JSON.stringify({ sourceTagId, targetTagId }),
    }),

  search: (params: {
    q: string;
    page?: number;
    pageSize?: number;
    tagIds?: number[];
    categories?: TagCategory[];
    type?: 'all' | 'segment' | 'interview';
  }): Promise<{ results: SearchResult[]; total: number }> => {
    const query = new URLSearchParams({ q: params.q });
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.tagIds?.length) query.set('tagIds', params.tagIds.join(','));
    if (params.categories?.length) query.set('categories', params.categories.join(','));
    if (params.type) query.set('type', params.type);
    return request(`/search?${query.toString()}`);
  },

  getPersonDetail: (id: number): Promise<PersonDetail> => request(`/people/${id}`),
};
