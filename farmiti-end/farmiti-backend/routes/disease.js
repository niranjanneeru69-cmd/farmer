const r=require('express').Router(),c=require('../controllers/diseaseController'),a=require('../middleware/auth'),{uploadDisease}=require('../middleware/upload')
r.post('/detect',a,uploadDisease.single('image'),c.detectDisease);r.get('/history',a,c.getDiseaseHistory);r.get('/:id',a,c.getDetection);r.put('/:id/status',a,c.updateStatus);r.delete('/:id',a,c.deleteDetection);module.exports=r
