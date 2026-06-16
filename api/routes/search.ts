import { Router, type Request, type Response } from 'express';
import * as searchService from '../services/searchService.js';
import type { TagCategory } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  const q = (req.query.q as string) || '';
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const type = (req.query.type as 'all' | 'segment' | 'interview') || 'all';
  const tagIds = req.query.tagIds ? (req.query.tagIds as string).split(',').map(id => parseInt(id)) : [];
  const categories = req.query.categories ? (req.query.categories as string).split(',') as TagCategory[] : [];

  const result = searchService.search({
    q,
    page,
    pageSize,
    tagIds,
    categories,
    type,
  });

  res.json({ success: true, data: result });
});

router.get('/segments', (req: Request, res: Response): void => {
  const q = (req.query.q as string) || '';
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const tagIds = req.query.tagIds ? (req.query.tagIds as string).split(',').map(id => parseInt(id)) : [];
  const categories = req.query.categories ? (req.query.categories as string).split(',') as TagCategory[] : [];

  const result = searchService.searchSegments({
    q,
    page,
    pageSize,
    tagIds,
    categories,
  });

  res.json({ success: true, data: result });
});

router.get('/interviews', (req: Request, res: Response): void => {
  const q = (req.query.q as string) || '';
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const tagIds = req.query.tagIds ? (req.query.tagIds as string).split(',').map(id => parseInt(id)) : [];

  const result = searchService.searchInterviews({
    q,
    page,
    pageSize,
    tagIds,
  });

  res.json({ success: true, data: result });
});

router.get('/stats', (req: Request, res: Response): void => {
  const stats = searchService.getStats();
  res.json({ success: true, data: stats });
});

router.get('/people/:id', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const person = searchService.getPersonDetail(id);

  if (!person) {
    res.status(404).json({ success: false, error: '人物不存在' });
    return;
  }

  res.json({ success: true, data: person });
});

export default router;
