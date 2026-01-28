import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';

const router = Router();
const searchController = new SearchController();

// Public search routes
router.get('/', searchController.searchApartments.bind(searchController));
router.get('/filters', searchController.getSuggestedFilters.bind(searchController));
router.get('/calendar/:apartmentId', searchController.getAvailabilityCalendar.bind(searchController));
router.post('/availability', searchController.checkDateAvailability.bind(searchController));

export default router;
