const path = require('path');
const fs = require('fs');
const router = require('express').Router();
const multer = require('multer');
const ctrl = require('./tenant.controller');
const { authenticate, authorize } = require('../../middleware/auth');

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/logos');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${req.tenantId}${ext}`);
  },
});

const ALLOWED_IMG_EXTS  = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_IMG_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // SVG excluded — can contain embedded scripts (XSS vector)
    if (!ALLOWED_IMG_EXTS.includes(ext) || !ALLOWED_IMG_MIMES.includes(file.mimetype))
      return cb(Object.assign(new Error('Only JPEG, PNG or WebP images allowed'), { statusCode: 400 }));
    cb(null, true);
  },
});

router.use(authenticate);
router.get('/profile', ctrl.getProfile);
router.put('/profile', authorize('OWNER', 'ADMIN'), ctrl.updateProfile);
router.post('/logo', authorize('OWNER', 'ADMIN'), logoUpload.single('logo'), ctrl.uploadLogo);
router.get('/modules', ctrl.getModules);
router.patch('/modules', authorize('OWNER'), ctrl.toggleModule);
router.get('/stats', ctrl.getStats);

module.exports = router;
