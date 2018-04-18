const { Manager } = require('../models/manager/manager');
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

module.exports = { checkForMgrExist };