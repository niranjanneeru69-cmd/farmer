const r=require('express').Router(),c=require('../controllers/chatController'),a=require('../middleware/auth')
r.post('/message',a,c.sendMessage);r.get('/history',a,c.getChatHistory);r.delete('/history',a,c.clearChatHistory);module.exports=r
