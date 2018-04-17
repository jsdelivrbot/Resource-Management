const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI).then(response => {
  console.log('Connected to moongodb');
}).catch(error => {
  console.log(error);
});;

module.exports = { mongoose };
