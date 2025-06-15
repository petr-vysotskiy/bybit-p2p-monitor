import { Router } from 'jsr:@oak/oak';
import { P2PController } from '../controllers/p2p.controller.ts';
import { auth } from '../middlewares/auth.middleware.ts';
import { localOnly } from '../middlewares/localOnly.middleware.ts';
import { PermissionList } from '../config/roles.ts';

const router = new Router();

// P2P Health check (public)
router.get('/api/p2p/health', P2PController.healthCheck);

// Get latest offers (public) - now serves only TBC bank data
router.get('/api/p2p/offers', P2PController.getLatestOffers);

// Get price aggregations for a token pair (requires authentication) - now serves only TBC bank data
router.get('/api/p2p/aggregations/:tokenId/:currencyId', auth([PermissionList.GET_ME]), P2PController.getPriceAggregations);

// Get market summary for a token pair (requires authentication) - now serves only TBC bank data
router.get('/api/p2p/summary/:tokenId/:currencyId', auth([PermissionList.GET_ME]), P2PController.getMarketSummary);

// Local-only endpoints (for cron and internal services)

// Fetch and store P2P data (public for testing) - now fetches only TBC bank data
router.post('/api/p2p/fetch', P2PController.fetchP2PData);
router.get('/api/p2p/fetch', P2PController.fetchP2PData);

// Monitor multiple token pairs (local only) - now monitors only TBC bank data
router.post('/api/p2p/monitor', localOnly(), P2PController.monitorTokenPairs);

// Admin only endpoints (require admin rights)

// Cleanup old data (admin only)
router.delete('/api/p2p/cleanup', auth([PermissionList.MANAGE_USERS]), P2PController.cleanupOldData);

export default router; 