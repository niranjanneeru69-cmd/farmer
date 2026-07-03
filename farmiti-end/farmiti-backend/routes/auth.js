const r=require('express').Router(),c=require('../controllers/authController'),a=require('../middleware/auth')
r.post('/register',c.register);r.post('/login',c.login);r.post('/send-otp',c.sendOTP);r.get('/me',a,c.me);module.exports=r
