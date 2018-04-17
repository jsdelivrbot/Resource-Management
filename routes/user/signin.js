const express = require('express');
const router = express.Router();
const _ = require('lodash');
const { ObjectID } = require('mongodb');

const { User } = require('../../models/user/user');
const { Role } = require('../../models/user/role');
const { ServiceProvider } = require('../../models/service-provider/service-provider');

const { CONSTANTS } = require('../../constants/constants');

router.post('/', (req, res) => {
  let body = _.pick(req.body, ['email', 'password']);
  User.findByCredentials(body.email, body.password).then(user => {
    return user.generateAuthToken().then(token => {
      res.header('x-auth', token).json(user);
    });
  }).catch(error => {
    res.status(400).json({ message: error });
  });
});

router.get('/user/activate-account/:_id', (req, res) => {
  let id = req.params._id;

  if (!ObjectID.isValid(id)) {
    return res.status(403).json();
  }

  activateUser(id).then(user => {
    if (user) {
      return res.status(200).json({ message: CONSTANTS.userActivated });
    }
    res.status(401).json();
  }).catch(error => {
    res.status(400).json({ message: error });
  });
});

let activateUser = async (id) => {
  let user = await User.findOne({ _id: id, status: 'Pending' });
  if (user) {
    return User.findOneAndUpdate({ _id: id }, { $set: { status: 'Active' } }, { new: true });
  }
  throw (CONSTANTS.noRecordFound);
};

router.get('/service-provider/activate-account/:_id', (req, res) => {
  let id = req.params._id;

  if (!ObjectID.isValid(id)) {
    return res.status(403).json();
  }

  activateServiceProvider(id).then(user => {
    if (user) {
      return res.status(200).json(CONSTANTS.serviceProviderActivated);
    }
    res.status(401).json();
  }).catch(error => {
    res.status(400).json({ message: error });
  });
});

let activateServiceProvider = async (id) => {
  let serviceProvider = await ServiceProvider.findOne({ _id: id, status: 'Pending' });
  return await ServiceProvider.findOneAndUpdate({ _id: id }, { $set: { status: 'Active' } });
};

module.exports = router;