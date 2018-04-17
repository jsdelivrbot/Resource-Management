const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const _ = require('lodash');
const { ObjectID } = require('mongodb');

const { upload } = require('../../middleware/multer-storage');
const { userUpdateValidator } = require('../../middleware/validate');
const { User, basicDetailsPayload, addressPayload } = require('../../models/user/user');
const { Voucher } = require('../../models/voucher/voucher');
const { validateActivationPin, setStatusValue } = require('../../middleware/voucher');

const { CONSTANTS } = require('../../constants/constants');
const { nextSeventhDay } = require('../../utils/util');

router.put('/', upload.fields([{ name: 'imageUrl', maxCount: 1 }]), userUpdateValidator, (req, res) => {
  let _id = req.user.id;
  let body = _.pick(req.body, ['firstName', 'lastName', 'gender', 'phoneNumber']);
  body.address = new Array();
  body.address[0] = _.pick(req.body, addressPayload);
  if (req.files && req.files.imageUrl && req.files.imageUrl[0]) {
    body.imageUrl = req.files.imageUrl[0].filename;
    try {
      req.user.imageUrl && fs.unlinkSync('public/uploads/' + req.user.imageUrl);
    } catch (error) {
      console.log(error);
    };
  }
  User.findOneAndUpdate({ _id }, { $set: body }, { new: true })
    .then(userDocument => {
      res.status(200).json(userDocument);
    }).catch(error => {
      try {
        req.files && req.files.imageUrl && req.files.imageUrl[0] && fs.unlinkSync(req.files.imageUrl[0].path);
      } catch (error) { };
      res.status(400).json({ message: CONSTANTS.somethingWentWrong });
    });
});

router.put('/change-password', (req, res) => {
  if (!req.body.currentPassword) {
    return res.status(400).json({ message: CONSTANTS.unauthorizedAccess });
  }
  let body = _.pick(req.body, ['currentPassword', 'password']);
  User.changePassword(req.user._id, body).then(() => {
    res.status(200).json({ message: CONSTANTS.passwordChanged });
  }).catch(error => {
    res.status(400).json({ message: error });
  });
});

router.post('/reserve-voucher', (req, res) => {
  if (!req.body.voucher) {
    return res.status(400).json({ message: CONSTANTS.selectVoucher });
  }
  Voucher.findOne({ _id: req.body.voucher, status: CONSTANTS.active })
    .then(voucher => {
      if (!voucher) {
        return res.status(400).json({ message: CONSTANTS.noVoucherFound });
      }
      voucher.status = CONSTANTS.reserved;
      voucher._reservedBy = req.user._id;
      voucher.reserved = new Date();
      voucher.save().then(() => {
        return res.status(200).json({ message: CONSTANTS.reservedSuccessfully });
      }).catch(error => {
        return res.status(400).json({ message: CONSTANTS.somethingWentWrong });
      });
    }).catch(error => {
      return res.status(400).json({ message: CONSTANTS.somethingWentWrong });
    });
});

router.get('/vouchers', async (req, res) => {
  Voucher.find({ _reservedBy: req.user._id }).then(vouchers => {
    res.status(200).json(vouchers);
  }).catch(error => {
    res.status(400).json({ message: CONSTANTS.somethingWentWrong });
  });
});

router.post('/avail-voucher', validateActivationPin, async (req, res) => {
  Voucher.findOne({ _id: req.body.voucher, status: CONSTANTS.reserved })
    .then(voucher => {
      if (!voucher) {
        return res.status(400).json({ message: CONSTANTS.noVoucherFound });
      }
      voucher.status = CONSTANTS.used;
      voucher.usedOn = new Date();
      voucher.save().then(() => {
        return res.status(200).json({ message: CONSTANTS.voucherAvailedSuccessfully });
      }).catch(error => {
        return res.status(400).json({ message: CONSTANTS.somethingWentWrong });
      });
    }).catch(error => {
      return res.status(400).json({ message: CONSTANTS.somethingWentWrong });
    });
});

router.post('/vouchers', setStatusValue, (req, res) => {
  Voucher.find({ _serviceProvider: req.body.serviceProvider, status: req.body.status }).then(vouchers => {
    res.status(200).json(vouchers);
  }).catch(error => {
    res.status(400).json({ message: CONSTANTS.somethingWentWrong });
  });
});

module.exports = router;