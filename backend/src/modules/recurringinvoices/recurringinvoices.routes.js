const router = require('express').Router();
const ctrl = require('./recurringinvoices.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/toggle', ctrl.toggle);
router.delete('/:id', ctrl.remove);
router.post('/generate', ctrl.generateDue);

module.exports = router;
