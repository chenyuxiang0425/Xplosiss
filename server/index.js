const express = require('express');

let api = express.Router();

api.get('/', (req, res) => {
  res.send({
    status: 'ok',
    message: 'hello world',
  });
});

api.use('/category', require('./category'));
api.use('/tag', require('./tag'));
api.use('/widget', require('./widget'));
api.use('/post', require('./post'));

module.exports = api;