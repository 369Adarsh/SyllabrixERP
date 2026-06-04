const router = require('express').Router();
const ctrl = require('./vitals.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.post('/',                                ctrl.record);
router.get('/appointment/:appointmentId',       ctrl.byAppointment);
router.get('/patient/:customerId',              ctrl.byPatient);
router.delete('/:id',                           ctrl.remove);

module.exports = router;
