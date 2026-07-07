const r=require('express').Router(),c=require('../controllers/weatherController'),a=require('../middleware/auth')
r.get('/current',a,c.getCurrentWeather);r.get('/alerts',a,c.getAlerts);r.post('/subscribe',a,c.subscribeAlerts);module.exports=r
