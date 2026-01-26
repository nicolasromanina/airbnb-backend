import { Request, Response } from 'express';
import cmsService from '../services/cms.service';

const getPage = async (req: Request, res: Response) => {
  try {
    const { page } = req.params;
    const data = await cmsService.loadPage(page);
    res.json({ page: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load page' });
  }
};

const savePage = async (req: Request, res: Response) => {
  try {
    const { page } = req.params;
    const payload = req.body;
    const snap = await cmsService.savePage(page, payload);
    res.json({ ok: true, snapshot: snap });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save page' });
  }
};

const getHistory = async (req: Request, res: Response) => {
  try {
    const { page } = req.params;
    const hist = await cmsService.getHistory(page);
    res.json({ history: hist });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get history' });
  }
};

const restore = async (req: Request, res: Response) => {
  try {
    const { page } = req.params;
    const { id } = req.body;
    const restored = await cmsService.restoreSnapshot(page, Number(id));
    if (!restored) return res.status(404).json({ error: 'Snapshot not found' });
    res.json({ ok: true, page: restored });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore snapshot' });
  }
};

export default { getPage, savePage, getHistory, restore };
