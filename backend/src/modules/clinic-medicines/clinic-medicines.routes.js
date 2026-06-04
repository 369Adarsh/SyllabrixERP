const router = require('express').Router();
const ctrl = require('./clinic-medicines.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/alerts/expiry',    ctrl.expiryAlerts);
router.get('/alerts/low-stock', ctrl.lowStockAlerts);
router.get('/schedule-h',       ctrl.scheduleHReg);
router.get('/suppliers',        ctrl.listSuppliers);
router.post('/suppliers',       ctrl.upsertSupplier);
router.delete('/suppliers/:id', ctrl.deleteSupplier);
router.get('/batches',          async (req, res) => { try { res.json([]); } catch (e) { res.status(500).json({ error: e.message }); } });
router.post('/batches',         ctrl.addBatch);
router.delete('/batches/:id',   ctrl.deleteBatch);
router.get('/dispenses',        ctrl.listDispenses);
router.post('/dispenses',       ctrl.dispense);
router.get('/',                 ctrl.listMedicines);
router.get('/:id',              ctrl.getMedicineById);
router.post('/',                ctrl.createMedicine);
router.patch('/:id',            ctrl.updateMedicine);
router.delete('/:id',           ctrl.deleteMedicine);

module.exports = router;
