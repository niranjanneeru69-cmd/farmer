const r=require('express').Router(),c=require('../controllers/schemesController'),a=require('../middleware/auth')
r.get('/',a,c.getSchemes);r.get('/enrollments',a,c.getEnrollments);r.get('/:id',a,c.getScheme);r.post('/:id/enroll',a,c.enrollScheme);r.delete('/enrollments/:id',a,c.deleteEnrollment);module.exports=r
