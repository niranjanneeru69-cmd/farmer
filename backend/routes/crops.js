const r=require('express').Router(),c=require('../controllers/cropsController'),a=require('../middleware/auth')
r.post('/recommend',a,c.getRecommendations);r.get('/history',a,c.getRecommendationHistory);r.delete('/history/:id',a,c.deleteHistory);module.exports=r
