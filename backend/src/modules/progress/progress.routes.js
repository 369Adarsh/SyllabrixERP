const router = require('express').Router();
const ctrl = require('./progress.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

// Homework
router.get('/homework',              ctrl.listHomework);
router.post('/homework',             ctrl.createHomework);
router.delete('/homework/:id',       ctrl.deleteHomework);
router.patch('/homework/:hwId/submissions/:studentId', ctrl.updateSubmission);
router.post('/homework/:hwId/bulk',  ctrl.bulkSubmissions);

// Teaching Log
router.get('/teaching-log',          ctrl.listTeachingLogs);
router.post('/teaching-log',         ctrl.createTeachingLog);
router.delete('/teaching-log/:id',   ctrl.deleteTeachingLog);

// Analytics
router.get('/student-progress',      ctrl.studentProgress);

// Exams
router.get('/exams',                            ctrl.listExams);
router.post('/exams',                           ctrl.createExam);
router.put('/exams/:id',                        ctrl.updateExam);
router.delete('/exams/:id',                     ctrl.deleteExam);
router.put('/exams/:examId/prep/:studentId',    ctrl.upsertStudentPrep);

module.exports = router;
