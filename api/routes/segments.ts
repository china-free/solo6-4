import { Router, type Request, type Response } from 'express';
import * as segmentService from '../services/segmentService.js';
import type { UpdateSegmentTagsRequest } from '../../shared/types.js';

const router = Router();

router.get('/:id', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const segment = segmentService.getSegmentById(id);

  if (!segment) {
    res.status(404).json({ success: false, error: '段落不存在' });
    return;
  }

  res.json({ success: true, data: segment });
});

router.put('/:id', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const { text } = req.body;

  if (text === undefined) {
    res.status(400).json({ success: false, error: '文本内容不能为空' });
    return;
  }

  const segment = segmentService.updateSegmentText(id, text);
  if (!segment) {
    res.status(404).json({ success: false, error: '段落不存在' });
    return;
  }

  res.json({ success: true, data: segment });
});

router.put('/:id/tags', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const { tagIds } = req.body as UpdateSegmentTagsRequest;

  if (!Array.isArray(tagIds)) {
    res.status(400).json({ success: false, error: '标签ID必须是数组' });
    return;
  }

  const tags = segmentService.updateSegmentTags(id, tagIds);

  res.json({ success: true, data: tags });
});

export default router;
