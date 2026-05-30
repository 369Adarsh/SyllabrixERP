const path   = require('path');
const fs     = require('fs');
const router = require('express').Router();
const multer = require('multer');
const ctrl   = require('./expenses.controller');
const { authenticate, authorize } = require('../../middleware/auth');

const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/receipts');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  },
});

const receiptUpload = multer({
  storage: receiptStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype) || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Only JPEG, PNG, WebP or PDF allowed'), { statusCode: 400 }));
    }
  },
});

router.use(authenticate);
router.get('/',           ctrl.list);
router.get('/summary',    ctrl.summary);
router.post('/',          authorize('OWNER', 'ADMIN', 'ACCOUNTANT'), ctrl.create);
router.put('/:id',        authorize('OWNER', 'ADMIN', 'ACCOUNTANT'), ctrl.update);
router.delete('/:id',     authorize('OWNER', 'ADMIN'), ctrl.remove);
router.post('/:id/receipt',   authorize('OWNER', 'ADMIN', 'ACCOUNTANT'), receiptUpload.single('receipt'), ctrl.uploadReceipt);
router.delete('/:id/receipt', authorize('OWNER', 'ADMIN', 'ACCOUNTANT'), ctrl.removeReceipt);

module.exports = router;
