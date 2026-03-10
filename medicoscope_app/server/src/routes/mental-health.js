const express = require('express');
const auth = require('../middleware/auth');
const MentalHealthNotification = require('../models/MentalHealthNotification');

const router = express.Router();

// POST /api/mental-health/notifications — save notification (called by chatbot, no auth)
router.post('/notifications', async (req, res) => {
  try {
    const { doctorId, patientId, patientName, clinicalReport, urgency, transcript } = req.body;

    if (!doctorId || !patientId || !patientName || !clinicalReport) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const notification = await MentalHealthNotification.create({
      doctorId,
      patientId,
      patientName,
      clinicalReport,
      urgency: urgency || 'low',
      transcript: transcript || '',
    });

    res.status(201).json({ notification });
  } catch (error) {
    console.error('Save mental health notification error:', error);
    res.status(500).json({ message: 'Failed to save notification' });
  }
});

// GET /api/mental-health/notifications/:doctorId — get notifications for doctor (auth required)
router.get('/notifications/:doctorId', auth, async (req, res) => {
  try {
    const notifications = await MentalHealthNotification.find({
      doctorId: req.params.doctorId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Map _id to id for Flutter compatibility
    const mapped = notifications.map(n => ({
      id: n._id.toString(),
      doctorId: n.doctorId.toString(),
      patientId: n.patientId,
      patientName: n.patientName,
      clinicalReport: n.clinicalReport,
      urgency: n.urgency,
      transcript: n.transcript,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));

    res.json({ notifications: mapped });
  } catch (error) {
    console.error('Get mental health notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// PUT /api/mental-health/notifications/:id/read — mark notification as read
router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    await MentalHealthNotification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Failed to mark as read' });
  }
});

// GET /api/mental-health/notifications/unread-count/:doctorId — get unread count
router.get('/notifications/unread-count/:doctorId', auth, async (req, res) => {
  try {
    const count = await MentalHealthNotification.countDocuments({
      doctorId: req.params.doctorId,
      read: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get count' });
  }
});

module.exports = router;
