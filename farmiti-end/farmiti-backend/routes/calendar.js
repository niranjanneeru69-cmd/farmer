const express = require('express')
const router = express.Router()

const calendarController = require('../controllers/calendar')
const auth = require('../middleware/auth')

// ✅ Protect all calendar routes
router.use(auth)

router.get('/', calendarController.getEvents)
router.post('/', calendarController.addEvent)
router.put('/:id', calendarController.updateEvent)
router.delete('/:id', calendarController.deleteEvent)

module.exports = router