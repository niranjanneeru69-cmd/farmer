const r=require('express').Router(),c=require('../controllers/historyController'),a=require('../middleware/auth')
r.get('/',a,c.getFullHistory);r.get('/summary',a,c.getSummary);r.delete('/clear-all',a,c.clearAllHistory);r.delete('/clear/:type',a,c.clearHistory);r.delete('/:type/:id',a,c.deleteHistoryItem);module.exports=r
