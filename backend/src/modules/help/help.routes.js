const router = require('express').Router();
const ctrl = require('./help.controller');
const { authenticate } = require('../../middleware/auth');

// Authenticated tenant users can fetch published help for any module
router.get('/:moduleKey', authenticate, ctrl.getPublic);

module.exports = router;
