const router = require('express').Router();
const prisma = require('../../config/prisma');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { tenantId: req.tenantId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: plans });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, category, price, duration, description, features, color, isActive, sortOrder } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Plan name is required' });
    const plan = await prisma.membershipPlan.create({
      data: {
        tenantId: req.tenantId,
        name,
        category: category || 'individual',
        price: parseFloat(price) || 0,
        duration: parseInt(duration) || 30,
        description: description || null,
        features: Array.isArray(features) ? features : [],
        color: color || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        sortOrder: parseInt(sortOrder) || 0,
      },
    });
    res.status(201).json({ success: true, data: plan });
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, price, duration, description, features, color, isActive, sortOrder } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (price !== undefined) data.price = parseFloat(price);
    if (duration !== undefined) data.duration = parseInt(duration);
    if (description !== undefined) data.description = description;
    if (features !== undefined) data.features = Array.isArray(features) ? features : [];
    if (color !== undefined) data.color = color;
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder);
    const plan = await prisma.membershipPlan.update({ where: { id: req.params.id, tenantId: req.tenantId }, data });
    res.json({ success: true, data: plan });
  } catch (e) { next(e); }
});

router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const existing = await prisma.membershipPlan.findUnique({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Plan not found' });
    const plan = await prisma.membershipPlan.update({ where: { id: req.params.id }, data: { isActive: !existing.isActive } });
    res.json({ success: true, data: plan });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.membershipPlan.delete({ where: { id: req.params.id, tenantId: req.tenantId } });
    res.json({ success: true, message: 'Plan deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
