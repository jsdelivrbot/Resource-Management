const express = require('express');
const router = express.Router();
const _ = require('lodash');

const { CONSTANTS } = require('../../constants/constants');
const { Manager } = require('../../models/manager/manager');
const { checkForMgrExist } = require('../../middleware/validate');


router.post('/', checkForMgrExist, (req, res) => {
  let manager = new Manager(req.body);
  manager.save().then(() => {
    return res.status(200).json({ message: CONSTANTS.mgrSuccess });
  }).catch(error => {
    return res.status(400).json({ message: CONSTANTS.mgrFailed });
  });
});

router.get('/', (req, res) => {
  Manager.find({}).then(managers => {
    res.status(200).json(managers);
  }).catch(error => {
    res.status(400).json({ message: CONSTANTS.mgrGETFailed });
  });
});

module.exports = router;