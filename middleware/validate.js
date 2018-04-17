const validator = require('validator');
const fs = require('fs');

const { User } = require('../models/user/user');
const { Role } = require('../models/user/role');
const { CONSTANTS } = require('../constants/constants');

const signupValidator = async (req, res, next) => {

  let validationMessages = [];
  let email = req.body.email;
  let firstName = req.body.firstName;
  let phoneNumber = req.body.phoneNumber;
  let roleName;
  if (req.url.match(/service/gi)) {
    roleName = CONSTANTS.serviceProvider;
    let establishmentName = req.body.name;
    if (!establishmentName) {
      validationMessages.push({ establishmentName: CONSTANTS.establishmentNameRequired });
    } else if (!validator.isLength(establishmentName, { min: 2, max: 50 })) {
      validationMessages.push({ establishmentName: CONSTANTS.invalidEstablishmentName });
    }
  } else {
    roleName = CONSTANTS.user;
  }
  if (!firstName) {
    validationMessages.push({ firstName: CONSTANTS.firstNameRequired });
  } else if (!validator.isAlphanumeric(firstName)) {
    validationMessages.push({ firstName: CONSTANTS.invalidName });
  }
  if (!email) {
    validationMessages.push({ email: CONSTANTS.emailRequired });
  } else if (!validator.isEmail(email)) {
    validationMessages.push({ email: CONSTANTS.invalidEmail });
  }
  if (!phoneNumber) {
    validationMessages.push({ mobile: CONSTANTS.phoneNumberRequired });
  } else if (isNaN(phoneNumber)) {
    validationMessages.push({ mobile: CONSTANTS.invalidPhoneNumber });
  }
  if (!req.body.password) {
    validationMessages.push({ password: CONSTANTS.passwordRequired });
  }
  if (validationMessages.length > 0) {
    try {
      req.files && req.files.imageUrl && req.files.imageUrl[0] && fs.unlinkSync(req.files.imageUrl[0].path);
    } catch (error) { };
    return res.status(400).json({ message: validationMessages });
  }
  try {
    let userByEmail = await User.findOne({ email: req.body.email });
    if (userByEmail) {
      return res.status(400).json({ message: CONSTANTS.emailUniqueError });
    }
    let userByPhoneNumber = await User.findOne({ phoneNumber: req.body.phoneNumber });
    if (userByPhoneNumber) {
      return res.status(400).json({ message: CONSTANTS.phoneNumberUniqueError });
    }
    let _role = await Role.findOne({ name: roleName });
    req._role = _role._id;
  } catch (error) {
    try {
      req.files && req.files.imageUrl && req.files.imageUrl[0] && fs.unlinkSync(req.files.imageUrl[0].path);
    } catch (error) { };
    return res.status(400).json({ message: CONSTANTS.somethingWentWrong });
  }
  next();
};

const serviceProviderValidator = async (req, res, next) => {
  let validationMessages = [];
  let establishmentName = req.body.name;
  if (!establishmentName) {
    validationMessages.push({ establishmentName: CONSTANTS.establishmentNameRequired });
  } else if (!validator.isLength(establishmentName, { min: 2, max: 50 })) {
    validationMessages.push({ establishmentName: CONSTANTS.invalidEstablishmentName });
  }
  if (validationMessages.length > 0) {
    try {
      req.files && req.files.imageUrl && req.files.imageUrl[0] && fs.unlinkSync(req.files.imageUrl[0].path);
    } catch (error) { };
    return res.status(400).json({ message: validationMessages });
  }
  next();
};

const userUpdateValidator = async (req, res, next) => {
  let validationMessages = [];
  let firstName = req.body.firstName;
  let phoneNumber = req.body.phoneNumber;
  if (firstName && !validator.isAlphanumeric(firstName)) {
    validationMessages.push({ firstName: CONSTANTS.invalidName });
  }
  if (phoneNumber && isNaN(phoneNumber)) {
    validationMessages.push({ mobile: CONSTANTS.invalidPhoneNumber });
  }
  if (validationMessages.length > 0) {
    try {
      req.files && req.files.imageUrl && req.files.imageUrl[0] && fs.unlinkSync(req.files.imageUrl[0].path);
    } catch (error) { };
    return res.status(400).json({ message: validationMessages });
  }
  try {
    let userByPhoneNumber = await User.findOne({ phoneNumber: req.body.phoneNumber, _id: { $ne: req.user._id } });
    if (userByPhoneNumber) {
      return res.status(400).json({ message: CONSTANTS.phoneNumberUniqueError });
    }
  } catch (error) {
    try {
      req.files && req.files.imageUrl && req.files.imageUrl[0] && fs.unlinkSync(req.files.imageUrl[0].path);
    } catch (error) { };
    return res.status(400).json({ message: CONSTANTS.somethingWentWrong });
  }
  next();
};

module.exports = { signupValidator, serviceProviderValidator, userUpdateValidator };