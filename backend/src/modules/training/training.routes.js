const router = require('express').Router();
const ctrl = require('./training.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

// Stats + activity
router.get('/stats',    ctrl.getStats);
router.get('/activity', ctrl.getActivity);

// Exercise library
router.get('/exercises',      ctrl.listExercises);
router.post('/exercises/seed', ctrl.seedExercises);
router.post('/exercises',     ctrl.createExercise);
router.put('/exercises/:id',  ctrl.updateExercise);
router.delete('/exercises/:id', ctrl.deleteExercise);

// Workout templates
router.get('/templates',     ctrl.listTemplates);
router.post('/templates',    ctrl.createTemplate);
router.get('/templates/:id', ctrl.getTemplate);
router.put('/templates/:id', ctrl.updateTemplate);
router.delete('/templates/:id', ctrl.deleteTemplate);

// Template days
router.post('/templates/:id/days',                              ctrl.addDay);
router.put('/templates/:id/days/:dayId',                        ctrl.updateDay);
router.delete('/templates/:id/days/:dayId',                     ctrl.deleteDay);
router.post('/templates/:id/days/:dayId/exercises',             ctrl.addExToDayCtrl);
router.put('/templates/:id/days/:dayId/exercises/:exId',        ctrl.updateDayExCtrl);
router.delete('/templates/:id/days/:dayId/exercises/:exId',     ctrl.removeDayExCtrl);

// Member plans
router.get('/member-plans',     ctrl.listMemberPlans);
router.post('/member-plans',    ctrl.assignPlan);
router.put('/member-plans/:id', ctrl.updateMemberPlan);
router.delete('/member-plans/:id', ctrl.deleteMemberPlan);

// Sessions per plan
router.get('/member-plans/:planId/sessions',  ctrl.listSessions);
router.post('/member-plans/:planId/sessions', ctrl.logSession);

// Member card (full profile)
router.get('/member-card/:memberId', ctrl.getMemberCard);

// Body stats
router.get('/body-stats/:memberId', ctrl.getBodyStats);
router.post('/body-stats', ctrl.addBodyStats);

// Trainer notes
router.get('/trainer-notes/:memberId', ctrl.getTrainerNotes);
router.post('/trainer-notes', ctrl.addTrainerNote);

// Trainer board + admin performance
router.get('/trainer-board',       ctrl.getTrainerBoard);
router.get('/trainer-performance', ctrl.getTrainerPerformance);

module.exports = router;
