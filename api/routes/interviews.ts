import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as interviewService from '../services/interviewService.js';
import type { CreateInterviewRequest, InterviewStatus } from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as InterviewStatus | undefined;
  const search = req.query.search as string | undefined;
  const tagIds = req.query.tagIds ? (req.query.tagIds as string).split(',').map(id => parseInt(id)) : [];

  const result = interviewService.getInterviews({
    page,
    pageSize,
    status,
    search,
    tagIds,
  });

  res.json({
    success: true,
    data: result,
  });
});

router.get('/recent', (req: Request, res: Response): void => {
  const limit = parseInt(req.query.limit as string) || 5;
  const interviews = interviewService.getRecentInterviews(limit);

  res.json({
    success: true,
    data: interviews,
  });
});

router.get('/:id', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const includeSegments = req.query.include === 'segments';

  if (includeSegments) {
    const interview = interviewService.getInterviewDetail(id);
    if (!interview) {
      res.status(404).json({ success: false, error: '访谈不存在' });
      return;
    }
    res.json({ success: true, data: interview });
  } else {
    const interview = interviewService.getInterviewById(id);
    if (!interview) {
      res.status(404).json({ success: false, error: '访谈不存在' });
      return;
    }
    res.json({ success: true, data: interview });
  }
});

router.post('/', (req: Request, res: Response): void => {
  const { title, interviewee, interviewer, interviewDate } = req.body as CreateInterviewRequest;

  if (!title || !title.trim()) {
    res.status(400).json({ success: false, error: '标题不能为空' });
    return;
  }

  const interview = interviewService.createInterview({
    title: title.trim(),
    interviewee,
    interviewer,
    interviewDate,
  });

  res.status(201).json({
    success: true,
    data: interview,
  });
});

router.put('/:id', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const data = req.body;

  const interview = interviewService.updateInterview(id, data);
  if (!interview) {
    res.status(404).json({ success: false, error: '访谈不存在' });
    return;
  }

  res.json({ success: true, data: interview });
});

router.delete('/:id', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const deleted = interviewService.deleteInterview(id);

  if (!deleted) {
    res.status(404).json({ success: false, error: '访谈不存在' });
    return;
  }

  res.json({ success: true, message: '删除成功' });
});

router.post('/:id/audio', upload.single('audio'), (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);

  if (!req.file) {
    res.status(400).json({ success: false, error: '请上传音频文件' });
    return;
  }

  const audioUrl = `/uploads/${req.file.filename}`;

  const interview = interviewService.updateInterview(id, {
    audioPath: req.file.filename,
    status: 'editing' as InterviewStatus,
  });

  if (!interview) {
    res.status(404).json({ success: false, error: '访谈不存在' });
    return;
  }

  res.json({
    success: true,
    data: { ...interview, audioUrl },
  });
});

router.post('/:id/import', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400).json({ success: false, error: '转写文本不能为空' });
    return;
  }

  const count = interviewService.importTranscript(id, text);

  if (count === 0) {
    res.status(400).json({ success: false, error: '导入失败，可能已存在段落' });
    return;
  }

  interviewService.updateInterview(id, { status: 'editing' as InterviewStatus });

  res.json({
    success: true,
    data: { importedCount: count },
  });
});

export default router;
