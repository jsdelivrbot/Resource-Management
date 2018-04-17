const express = require('express');
const router = express.Router();
const _ = require('lodash');
const fs = require('fs');

const { ServiceProvider } = require('../../models/service-provider/service-provider');
const { User, basicDetailsPayload, addressPayload } = require('../../models/user/user');
const { Role } = require('../../models/user/role');

const { CONSTANTS } = require('../../constants/constants');
const { signupValidator } = require('../../middleware/validate');
const { sendUserActivationMail, sendNewServiceProviderNotificationMail, sendForgetPasswordLink } = require('../../notifications/email/signup');

router.post('/user', signupValidator, (req, res) => {
  let body = _.pick(req.body, basicDetailsPayload);
  body.address = _.pick(req.body, addressPayload);
  try {
    req.files && req.files.imageUrl && req.files.imageUrl[0] && (body.imageUrl = req.files.imageUrl[0].filename);
  } catch (error) { };
  body._role = req._role;
  let user = new User(body);
  user.save().then(userDocument => {
    sendUserActivationMail(userDocument, (error, response) => {
      if (error) {
        res.status(201).json({ message: error });
      } else {
        res.status(200).json({ message: response });
      }
    });
    // res.status(200).json({ message: 'test' });
  }).catch(error => {
    try {
      req.files && req.files.imageUrl && req.files.imageUrl[0] && fs.unlinkSync(req.files.imageUrl[0].path);
    } catch (error) { };
    res.status(400).json({ message: CONSTANTS.somethingWentWrong });
  });
});

router.post('/service-provider', signupValidator, (req, res) => {
  let serviceProviderPayload = _.pick(req.body, [
    'name',
    'establishment',
    'description',
    'parkingAccess',
    'parkingMinutes',
    'wheelChairAccess',
    'wifiAcces',
    'openingTime',
    'closingTime'
  ]);
  serviceProviderPayload.contactInformation = _.pick(req.body, [
    'email',
    'countryCode',
    'phoneNumber',
    'website',
    'facebook',
    'twitter',
    'instagram'
  ]);
  if (req.body.serviceType) {
    serviceProviderPayload._serviceType = req.body.serviceType;
  }
  if (req.body.service) {
    serviceProviderPayload._service = req.body.service;
  }
  serviceProviderPayload.address = _.pick(req.body, addressPayload);
  //Need to remove the following line
  serviceProviderPayload.status = 'Active';
  let serviceProvider = new ServiceProvider(serviceProviderPayload);
  serviceProvider.save().then(serviceProviderDocument => {
    let userPayload = _.pick(req.body, basicDetailsPayload);
    userPayload.address = _.pick(req.body, addressPayload);
    userPayload._serviceProvider = serviceProviderDocument._id;
    userPayload._role = req._role;
    req.files && req.files.imageUrl && req.files.imageUrl[0] && (userPayload.imageUrl = req.files.imageUrl[0].filename);
    //Need to remove the following line
    userPayload.status = 'Active';
    let user = new User(userPayload);
    user.save().then(userDocument => {
      sendNewServiceProviderNotificationMail(serviceProviderDocument, userDocument, (error, response) => {
        if (error) {
          res.status(201).json({ message: error });
        } else {
          res.status(200).json({ message: response });
        }
      });
      // res.status(200).json({ message: 'success' });
    }).catch(error => {
      try {
        req.files && req.files.imageUrl && req.files.imageUrl[0] && fs.unlinkSync(req.files.imageUrl[0].path);
      } catch (error) { };
      ServiceProvider.findOneAndRemove({
        _id: serviceProviderDocument._id
      }).then(() => {
        return res.status(400).json({ message: CONSTANTS.somethingWentWrong });
      }).catch(error => {
        return res.status(400).json({ message: CONSTANTS.somethingWentWrong });
      });
    });
  }).catch(error => {
    try {
      req.files && req.files.imageUrl && req.files.imageUrl[0] && fs.unlinkSync(req.files.imageUrl[0].path);
    } catch (error) { };
    return res.status(400).json({ message: CONSTANTS.emailUniqueError });
  });
});

router.post('/forget-password', (req, res) => {
  let body = _.pick(req.body, ['email']);
  User.resetPasswordTokenByEmail(body.email).then(user => {
    console.log(user.resetPasswordToken);
    sendForgetPasswordLink(user, (error, response) => {
      if (error) {
        res.status(201).json({ message: error });
      } else {
        res.status(200).json({ message: response });
      }
    });
  }).catch(error => {
    console.log(error);
    res.status(400).json({ message: error });
  });
});

router.get('/reset-password/:token', (req, res) => {
  let token = req.params.token;
  User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } })
    .select('resetPasswordToken')
    .then(user => {
      if (user) {
        return res.render('reset-password/reset-password', { title: CONSTANTS.resetTitle });
      }
      return res.render('status', { message: CONSTANTS.invalidResetPasswordToken });
    }).catch(error => {
      return res.render('status', { message: CONSTANTS.somethingWentWrong });
    });
});

router.post('/reset-password/:token', (req, res) => {
  let token = req.params.token;
  let body = _.pick(req.body, ['password']);
  if (body.password.length < 6) {
    return res.render('reset-password/reset-password', { title: CONSTANTS.resetTitle, message: CONSTANTS.passwordLength });
  }
  User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }).then(user => {
    if (user) {
      user.password = body.password;
      user.resetPasswordToken = '';
      user.resetPasswordExpires = null;
      user.tokens = [];
      user.save().then(() => {
        return res.render('status', { message: CONSTANTS.passwordResetSuccess });
      }).catch(error => {
        return res.render('status', { message: CONSTANTS.somethingWentWrong });
      });
    } else {
      return res.render('status', { message: CONSTANTS.invalidResetPasswordToken });
    }
  }).catch(error => {
    res.status(400).send({ message: CONSTANTS.somethingWentWrong });
  });
});

router.post('/role', (req, res) => {
  let body = _.pick(req.body, ['name']);

  if (body.name == CONSTANTS.serviceProvider) {

    let permissions = new Array();
    let signout = new Object();
    signout.view = '/api/signout/';
    signout.privilages = { 'read': false, 'delete': true };
    permissions.push(signout);

    let serviceType = new Object();
    serviceType.view = '/api/service-provider/service-type';
    serviceType.privilages = { 'create': false, 'update': false, 'delete': false };
    permissions.push(serviceType);

    let service = new Object();
    service.view = '/api/service-provider/service';
    service.privilages = { 'create': false, 'update': false, 'delete': false };
    permissions.push(service);

    let serviceProvider = new Object();
    serviceProvider.view = '/api/service-provider';
    serviceProvider.privilages = { 'create': true, 'update': true, 'delete': true };
    permissions.push(serviceProvider);

    let serviceProviderQueryParams = new Object();
    serviceProviderQueryParams.view = '/api/service-provider/';
    serviceProviderQueryParams.privilages = { 'create': true, 'update': true, 'delete': true };
    permissions.push(serviceProviderQueryParams);

    let vouchers = new Object();
    vouchers.view = '/api/voucher/';
    vouchers.privilages = { 'read': true };
    permissions.push(vouchers);

    permissions.push({ view: '/api/voucher', privilages: { 'read': true } });

    let plan = new Object();
    plan.view = '/api/service-provider/plan';
    plan.privilages = { 'create': true, 'update': true, 'delete': true };
    permissions.push(plan);

    let package = new Object();
    package.view = '/api/pricing/packages/';
    package.privilages = { 'create': true, 'update': true, 'delete': true };
    permissions.push(package);

    let updatepin = new Object();
    updatepin.view = '/api/service-provider/update-pin';
    updatepin.privilages = { 'create': true, 'update': true };
    permissions.push(updatepin);

    let SPVouchers = new Object();
    SPVouchers.view = '/api/service-provider/vouchers';
    SPVouchers.privilages = { 'read': true };
    permissions.push(SPVouchers);

    let changePassword = new Object();
    changePassword.view = '/api/user/change-password';
    changePassword.privilages = { 'read': false, 'update': true };
    permissions.push(changePassword);

    body.permissions = permissions;
  }

  if (body.name == CONSTANTS.user) {

    let permissions = new Array();
    let signout = new Object();
    signout.view = '/api/signout/';
    signout.privilages = { 'read': false, 'delete': true };
    permissions.push(signout);

    let user = new Object();
    user.view = '/api/user';
    user.privilages = { 'read': false, 'update': true };
    permissions.push(user);

    permissions.push({ view: '/api/user/', privilages: { 'read': false, 'update': true } });
    permissions.push({ view: '/api/service-provider/review/', privilages: { 'create': true, 'read': true, 'update': true, 'delete': true } });
    permissions.push({ view: '/api/service-provider/review', privilages: { 'create': true, 'read': true, 'update': true, 'delete': true } });

    let userVouchers = new Object();
    userVouchers.view = '/api/user/vouchers';
    userVouchers.privilages = { 'read': true, 'create': true };
    permissions.push(userVouchers);

    let vouchers = new Object();
    vouchers.view = '/api/voucher';
    vouchers.privilages = { 'read': true };
    permissions.push(vouchers);

    permissions.push({ view: '/api/voucher', privilages: { 'read': true } });

    let reserveVoucher = new Object();
    reserveVoucher.view = '/api/user/reserve-voucher';
    reserveVoucher.privilages = { 'create': true };
    permissions.push(reserveVoucher);

    let activateVoucher = new Object();
    activateVoucher.view = '/api/user/avail-voucher';
    activateVoucher.privilages = { 'create': true };
    permissions.push(activateVoucher);

    let changePassword = new Object();
    changePassword.view = '/api/user/change-password';
    changePassword.privilages = { 'read': false, 'update': true };
    permissions.push(changePassword);

    let serviceProvider = new Object();
    serviceProvider.view = '/api/service-provider';
    serviceProvider.privilages = { 'read': true };
    permissions.push(serviceProvider);

    let serviceProviderQueryParams = new Object();
    serviceProviderQueryParams.view = '/api/service-provider/';
    serviceProviderQueryParams.privilages = { 'read': true };
    permissions.push(serviceProviderQueryParams);

    body.permissions = permissions;
  }

  let role = new Role(body);
  role.save().then(role => {
    res.status(200).json(role);
  }).catch(error => {
    res.status(400).json({ message: error });
  })
});

module.exports = router;
