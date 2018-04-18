require('./config/config');
require('./database/mongoose');

const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');

const manager = require('./routes/manager/manager');
const project = require('./routes/project/project');
const employee = require('./routes/employee/employee');

const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use('/api/manager', manager);
app.use('/api/project', project);
app.use('/api/employee', employee);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  let error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// error handler
app.use((error, req, res) => {
  res.status(error.status || 500);
  res.json({ message: error });
});

app.listen(process.env.PORT, () => {
  console.log(`Server listining on PORT ${process.env.PORT}`);
});

module.exports = app;