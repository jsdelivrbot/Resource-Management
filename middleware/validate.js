const { Manager } = require('../models/manager/manager');
const { Project } = require('../models/project/project');
const { CONSTANTS } = require('../constants/constants');

const checkForMgrExist = async (req, res, next) => {
  let validationMessages = [];
  let managerId = req.body.managerId;
  let managerName = req.body.managerName;
  if (managerId && isNaN(managerId)) {
    validationMessages.push({ ID : CONSTANTS.mgrIdReq });
  }
  if (!managerName) {
    validationMessages.push({ name : CONSTANTS.mgrNameReq });
  }
  if (validationMessages.length > 0) {
    return res.status(400).json({ message: validationMessages });
  }
  try {
    let managerByID = await Manager.findOne({ managerId: req.body.managerId });
    if (managerByID) {
      return res.status(400).json({ message: CONSTANTS.mgrExist });
    }
  } catch (error) {
    return res.status(400).json({ message: CONSTANTS.failToFecthMgrID });
  }
  next();
};

const checkProjExist = async (req, res, next) => {
  let validationMessages = [];
  let projectId = req.body.ID;
  let projectName = req.body.name;
  if (projectId && isNaN(projectId)) {
    validationMessages.push({ ID : CONSTANTS.projIdReq });
  }
  if (!projectName) {
    validationMessages.push({ name : CONSTANTS.projNameReq });
  }
  if (validationMessages.length > 0) {
    return res.status(400).json({ message: validationMessages });
  }
  try {
    let projectByID = await Project.findOne({ projectId: req.body.ID });
    if (projectByID) {
      return res.status(400).json({ message: CONSTANTS.projExist });
    }
  } catch (error) {
    return res.status(400).json({ message: CONSTANTS.failToFecthProjID });
  }
  next();
};

module.exports = { checkForMgrExist, checkProjExist };