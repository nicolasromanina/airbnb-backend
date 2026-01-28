import { Router } from 'express';
import cmsCtrl from '../controllers/cms.controller';

const router = Router();

// Public CMS routes - accessible without authentication
router.get('/:page', cmsCtrl.getPage);

export default router;
