const router = require('express').Router();
const ctrl = require('./ai.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.post('/chat', ctrl.chat);
router.get('/insights', ctrl.getInsights);

module.exports = router;
