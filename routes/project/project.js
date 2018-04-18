const express = require('express');
const router = express.Router();
const _ = require('lodash');
const { ObjectID } = require('mongodb');

const { CONSTANTS } = require('../../constants/constants');
const { Project } = require('../../models/project/project');
const { checkProjExist } = require('../../middleware/validate');


router.post('/', checkProjExist, (req, res) => {
  let project = new Project();
  project.projectId = req.body.ID;
  project.projectName = req.body.name;
  project._manager = ObjectID(req.body.projMgrID); 
  project.save().then(() => {
    return res.status(200).json({ message: CONSTANTS.projSuccess });
  }).catch(error => {
    return res.status(400).json({ message: CONSTANTS.projFailed });
  });
});

router.get('/', (req, res) => {
  Project.find({}).populate('_manager').then(projects => {
    res.status(200).json(projects);
  }).catch(error => {
    res.status(400).json({ message: CONSTANTS.projGETFailed });
  });
});

module.exports = router;