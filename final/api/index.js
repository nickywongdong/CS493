const router = module.exports = require('express').Router();

router.use('/beer', require('./beer').router);
router.use('/reviews', require('./reviews').router);
router.use('/manufacturer', require('./manufacturer').router);
router.use('/photos', require('./photos').router);
router.use('/users', require('./users').router);
