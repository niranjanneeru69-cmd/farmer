const r=require('express').Router(),c=require('../controllers/farmerController'),a=require('../middleware/auth'),{uploadAvatar}=require('../middleware/upload')
r.get('/profile',a,c.getProfile);r.put('/profile',a,c.updateProfile);r.put('/complete-tour',a,c.completeTour);r.put('/avatar',a,uploadAvatar.single('avatar'),c.updateAvatar);r.delete('/avatar',a,c.deleteAvatar)
r.get('/crops',a,c.getCrops);r.post('/crops',a,c.addCrop);r.put('/crops/:id',a,c.updateCrop);r.delete('/crops/:id',a,c.deleteCrop)
r.delete('/account',a,c.deleteAccount);module.exports=r

