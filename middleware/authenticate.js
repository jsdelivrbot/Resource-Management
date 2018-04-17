const { User } = require('../models/user/user');
const { CONSTANTS } = require('../constants/constants');

const isGrantedPrivilage = (role, view, action) => {
  console.log(view);
  if (role.name == CONSTANTS.admin) {
    return true;
  }
  switch (action) {
    case CONSTANTS.post:
      actionType = CONSTANTS.create;
      break;
    case CONSTANTS.get:
      actionType = CONSTANTS.read;
      break;
    case CONSTANTS.put:
      actionType = CONSTANTS.update;
      break;
    case CONSTANTS.delete:
      actionType = CONSTANTS.delete;
      break;
    default:
      return false;
  }
  let privilage = role.permissions.filter(permission => permission.view == view);
  if (privilage.length > 0) {
    return privilage[0].privilages[actionType];
  }
  return false;
};

const authenticate = (req, res, next) => {
  const token = req.header('x-auth');
  User.findByToken(token).then(user => {
    if (!user) {
      return Promise.reject(CONSTANTS.unauthorizedAccess);
    }
    let method = req.method.toLowerCase();
    if (!isGrantedPrivilage(user._role, req.baseUrl + req.path, method)) {
      return Promise.reject(CONSTANTS.noPrivilage);
    }
    req.user = user;
    req.token = token;
    next();
  }).catch(error => {
    res.status(401).json({ message: error });
  });
};

module.exports = { authenticate };
