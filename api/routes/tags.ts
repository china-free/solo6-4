import { Router, type Request, type Response } from 'express';
import * as tagService from '../services/tagService.js';
import type { TagCategory, CreateTagRequest, UpdateTagRequest, MergeTagsRequest } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  const category = req.query.category as TagCategory | undefined;
  const search = req.query.search as string | undefined;

  if (search) {
    const tags = tagService.searchTags(search, category, 20);
    res.json({ success: true, data: tags });
  } else {
    const tags = tagService.getTags(category);
    res.json({ success: true, data: tags });
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const tag = tagService.getTagById(id);

  if (!tag) {
    res.status(404).json({ success: false, error: '标签不存在' });
    return;
  }

  res.json({ success: true, data: tag });
});

router.post('/', (req: Request, res: Response): void => {
  const { name, category, color } = req.body as CreateTagRequest;

  if (!name || !name.trim()) {
    res.status(400).json({ success: false, error: '标签名称不能为空' });
    return;
  }

  if (!category || !['person', 'location', 'era', 'event'].includes(category)) {
    res.status(400).json({ success: false, error: '无效的标签分类' });
    return;
  }

  const tag = tagService.createTag({
    name: name.trim(),
    category,
    color,
  });

  res.status(201).json({ success: true, data: tag });
});

router.put('/:id', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const data = req.body as UpdateTagRequest;

  const tag = tagService.updateTag(id, data);
  if (!tag) {
    res.status(404).json({ success: false, error: '标签不存在' });
    return;
  }

  res.json({ success: true, data: tag });
});

router.delete('/:id', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const deleted = tagService.deleteTag(id);

  if (!deleted) {
    res.status(404).json({ success: false, error: '标签不存在' });
    return;
  }

  res.json({ success: true, message: '删除成功' });
});

router.post('/merge', (req: Request, res: Response): void => {
  const { sourceTagId, targetTagId } = req.body as MergeTagsRequest;

  if (!sourceTagId || !targetTagId) {
    res.status(400).json({ success: false, error: '源标签和目标标签ID不能为空' });
    return;
  }

  const result = tagService.mergeTags(sourceTagId, targetTagId);

  if (!result) {
    res.status(400).json({ success: false, error: '合并失败' });
    return;
  }

  res.json({ success: true, message: '合并成功' });
});

export default router;
