const r=require('express').Router(),c=require('../controllers/marketController'),a=require('../middleware/auth')
r.get('/prices',a,c.getPrices);r.get('/prices/:id/history',a,c.getPriceHistory);r.get('/categories',a,c.getCategories);r.get('/top-movers',a,c.getTopMovers);r.post('/analyze',a,c.analyzeMarket);module.exports=r
