const router = require('express').Router();
const ctrl = require('./clinical-notes.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/appointment/:appointmentId', ctrl.byAppointment);
router.get('/patient/:customerId',        ctrl.patientHistory);
router.post('/',                          ctrl.save);
router.delete('/:id',                     ctrl.remove);

module.exports = router;
