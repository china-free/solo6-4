import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  Upload,
  FileText,
  Clock,
  User,
  Calendar,
  Settings,
  MoreVertical,
  PlayCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import AudioPlayer from '@/components/AudioPlayer';
import TagBadge from '@/components/TagBadge';
import TagSelector from '@/components/TagSelector';
import type { Segment, Tag } from '@shared/types.js';

export default function InterviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const interviewId = parseInt(id || '0');

  const { currentInterview, currentSegments, selectedSegmentId, currentTime, isPlaying } = useAppStore();
  const { fetchInterviewDetail, setSelectedSegmentId, setCurrentTime, setIsPlaying, updateSegmentText, updateSegmentTags } = useAppStore();

  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [showAudioUpload, setShowAudioUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const segmentRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (interviewId) {
      fetchInterviewDetail(interviewId);
    }
  }, [interviewId, fetchInterviewDetail]);

  useEffect(() => {
    if (currentSegments.length > 0 && selectedSegmentId === null) {
      setSelectedSegmentId(currentSegments[0].id);
    }
  }, [currentSegments, selectedSegmentId, setSelectedSegmentId]);

  useEffect(() => {
    if (currentSegments.length === 0) return;

    let currentSeg: Segment | undefined;
    for (let i = currentSegments.length - 1; i >= 0; i--) {
      if (currentTime >= currentSegments[i].startTime) {
        currentSeg = currentSegments[i];
        break;
      }
    }

    if (currentSeg && currentSeg.id !== selectedSegmentId && !editingSegmentId) {
      setSelectedSegmentId(currentSeg.id);
      const el = segmentRefs.current[currentSeg.id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, currentSegments, selectedSegmentId, editingSegmentId, setSelectedSegmentId]);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function handleSegmentClick(segment: Segment) {
    setSelectedSegmentId(segment.id);
    setCurrentTime(segment.startTime);
  }

  function startEdit(segment: Segment) {
    setEditingSegmentId(segment.id);
    setEditingText(segment.text);
  }

  async function saveEdit() {
    if (editingSegmentId === null) return;

    try {
      await updateSegmentText(editingSegmentId, editingText);
      setEditingSegmentId(null);
      setEditingText('');
    } catch (e) {
      alert('保存失败，请重试');
    }
  }

  function cancelEdit() {
    setEditingSegmentId(null);
    setEditingText('');
  }

  async function handleTagsChange(tagIds: number[]) {
    if (selectedSegmentId === null) return;
    try {
      await updateSegmentTags(selectedSegmentId, tagIds);
    } catch (e) {
      console.error('Failed to update tags:', e);
    }
  }

  const selectedSegment = currentSegments.find(s => s.id === selectedSegmentId);

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !interviewId) return;

    try {
      await api.uploadAudio(interviewId, file);
      fetchInterviewDetail(interviewId);
      setShowAudioUpload(false);
    } catch (err) {
      alert('上传失败，请重试');
    }
  }

  async function handleImportTranscript() {
    if (!importText.trim() || !interviewId) return;

    try {
      await api.importTranscript(interviewId, importText);
      fetchInterviewDetail(interviewId);
      setShowImportModal(false);
      setImportText('');
    } catch (err) {
      alert('导入失败：' + (err as Error).message);
    }
  }

  if (!currentInterview) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-warm-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-warm-200 rounded w-1/4 mb-8" />
          <div className="h-16 bg-warm-200 rounded mb-6" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-warm-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const audioUrl = currentInterview.audioUrl
    ? `/uploads/${currentInterview.audioUrl}`
    : '';

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b border-warm-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/interviews"
              className="p-2 text-warm-500 hover:text-primary-600 hover:bg-warm-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-serif font-bold text-primary-900">
                {currentInterview.title}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-warm-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {currentInterview.interviewee || '未填写受访者'}
                </span>
                {currentInterview.interviewDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {currentInterview.interviewDate}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(currentInterview.duration)}
                </span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    currentInterview.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : currentInterview.status === 'editing'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {currentInterview.status === 'completed'
                    ? '已完成'
                    : currentInterview.status === 'editing'
                    ? '校对中'
                    : '草稿'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!audioUrl && (
              <button
                onClick={() => setShowAudioUpload(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                上传音频
              </button>
            )}
            {currentSegments.length === 0 && (
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
              >
                <FileText className="w-4 h-4" />
                导入转写稿
              </button>
            )}
            <button className="p-2 text-warm-500 hover:text-primary-600 hover:bg-warm-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {audioUrl && (
        <div className="px-6 py-3 bg-primary-50 border-b border-warm-200">
          <AudioPlayer
            src={audioUrl}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            isPlaying={isPlaying}
            onPlayStateChange={setIsPlaying}
          />
        </div>
      )}

      {!audioUrl && (
        <div className="px-6 py-8 bg-warm-50 border-b border-warm-200 text-center">
          <PlayCircle className="w-12 h-12 mx-auto text-warm-300 mb-2" />
          <p className="text-warm-500 mb-3">暂无音频文件</p>
          <button
            onClick={() => setShowAudioUpload(true)}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            点击上传音频
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {currentSegments.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 mx-auto text-warm-300 mb-4" />
                <h3 className="text-lg font-serif font-semibold text-primary-800 mb-2">
                  暂无转写文本
                </h3>
                <p className="text-warm-500 mb-4">
                  导入转写稿后，可逐段进行校对
                </p>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  导入转写稿
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {currentSegments.map((segment, index) => {
                  const isSelected = segment.id === selectedSegmentId;
                  const isEditing = segment.id === editingSegmentId;
                  const isActive = currentTime >= segment.startTime && currentTime < segment.endTime;

                  return (
                    <div
                      key={segment.id}
                      ref={(el) => { segmentRefs.current[segment.id] = el; }}
                      className={cn(
                        'p-4 rounded-lg border transition-all duration-200 cursor-pointer',
                        isSelected
                          ? 'border-primary-400 bg-primary-50 shadow-sm'
                          : isActive
                          ? 'border-accent-300 bg-accent-50'
                          : 'border-warm-200 bg-white hover:border-warm-300'
                      )}
                      onClick={() => handleSegmentClick(segment)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-16">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSegmentClick(segment);
                            }}
                            className="text-xs font-mono text-warm-500 hover:text-primary-600 bg-warm-100 px-2 py-1 rounded transition-colors"
                          >
                            {formatTime(segment.startTime)}
                          </button>
                          {segment.isEdited && (
                            <div className="mt-1 text-xs text-accent-600 flex items-center gap-1">
                              <Edit3 className="w-3 h-3" />
                              已校对
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div onClick={(e) => e.stopPropagation()}>
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full p-3 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                rows={4}
                                autoFocus
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={saveEdit}
                                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                                >
                                  <Save className="w-4 h-4" />
                                  保存
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-warm-600 hover:bg-warm-100 rounded transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                  取消
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-gray-800 leading-relaxed">
                                {segment.text}
                              </p>
                              {segment.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {segment.tags.map(tag => (
                                    <TagBadge key={tag.id} tag={tag} size="sm" />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {!isEditing && isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(segment);
                            }}
                            className="flex-shrink-0 p-1.5 text-warm-400 hover:text-primary-600 hover:bg-warm-100 rounded transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="w-80 border-l border-warm-200 bg-white flex flex-col">
          <div className="p-4 border-b border-warm-100">
            <h3 className="font-serif font-semibold text-primary-800 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              标签管理
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedSegment ? (
              <div>
                <p className="text-sm text-warm-500 mb-3">
                  为第 {currentSegments.findIndex(s => s.id === selectedSegmentId) + 1} 段添加标签
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-2 block">
                      段落标签
                    </label>
                    <TagSelector
                      selectedTags={selectedSegment.tags}
                      onTagsChange={handleTagsChange}
                    />
                  </div>

                  {selectedSegment.tags.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-2 block">
                        已添加标签
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSegment.tags.map(tag => (
                          <TagBadge key={tag.id} tag={tag} showCategory size="sm" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-warm-100">
                  <h4 className="text-sm font-medium text-warm-700 mb-2">段落信息</h4>
                  <div className="space-y-2 text-sm text-warm-500">
                    <div className="flex justify-between">
                      <span>开始时间</span>
                      <span className="font-mono">{formatTime(selectedSegment.startTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>结束时间</span>
                      <span className="font-mono">{formatTime(selectedSegment.endTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>持续时长</span>
                      <span className="font-mono">
                        {formatTime(selectedSegment.endTime - selectedSegment.startTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>字数</span>
                      <span>{selectedSegment.text.length} 字</span>
                    </div>
                    <div className="flex justify-between">
                      <span>状态</span>
                      <span className={selectedSegment.isEdited ? 'text-emerald-600' : 'text-warm-400'}>
                        {selectedSegment.isEdited ? '已校对' : '未校对'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-warm-400">
                <p className="text-sm">选择一个段落来编辑标签</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAudioUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-warm-100">
              <h2 className="text-xl font-serif font-semibold text-primary-800">
                上传音频
              </h2>
              <p className="text-sm text-warm-500 mt-1">支持 MP3、WAV 等格式</p>
            </div>
            <div className="p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-warm-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
              >
                <Upload className="w-10 h-10 mx-auto text-warm-400 mb-3" />
                <p className="text-warm-600">点击选择音频文件</p>
                <p className="text-xs text-warm-400 mt-1">或拖拽文件到此处</p>
              </div>
            </div>
            <div className="p-6 border-t border-warm-100 flex justify-end">
              <button
                onClick={() => setShowAudioUpload(false)}
                className="px-4 py-2 text-warm-600 hover:bg-warm-100 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
            <div className="p-6 border-b border-warm-100">
              <h2 className="text-xl font-serif font-semibold text-primary-800">
                导入转写稿
              </h2>
              <p className="text-sm text-warm-500 mt-1">
                粘贴转写文本，系统将自动分段
              </p>
            </div>
            <div className="p-6">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="请粘贴转写文本...&#10;&#10;支持带时间戳的格式，例如：&#10;[00:00] 第一段内容&#10;[00:30] 第二段内容"
                className="w-full h-64 p-4 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <div className="p-6 border-t border-warm-100 flex justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-warm-600 hover:bg-warm-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleImportTranscript}
                disabled={!importText.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
