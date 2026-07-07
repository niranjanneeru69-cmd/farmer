const r=require('express').Router(),c=require('../controllers/notificationController'),a=require('../middleware/auth')
r.get('/',a,c.getNotifications);r.put('/read-all',a,c.markAllRead);r.put('/:id/read',a,c.markRead);r.delete('/clear-all',a,c.clearAll);r.delete('/:id',a,c.deleteNotification);module.exports=r
