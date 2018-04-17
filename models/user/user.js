const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { Role } = require('./role');
const { ServiceProvider } = require('../service-provider/service-provider');
const { ServiceType } = require('../../models/service-provider/service-type');
const { Service } = require('../../models/service-provider/service');

const { CONSTANTS } = require('../../constants/constants');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    require: true,
    minlength: 3
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
  },
  imageUrl: {
    type: String
  },
  gender: {
    type: String,
    enum: ['Female', 'Male']
  },
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    require: true,
    minlength: 2
  },
  countryCode: {
    type: String
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  address: [
    {
      location: {
        type: String
      },
      city: {
        type: String
      },
      state: {
        type: String
      },
      country: {
        type: String
      },
      zipCode: {
        type: String
      }
    }
  ],
  _role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },
  _serviceProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider'
  },
  updated: {
    type: Date,
    default: Date.now
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }],
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Disable', 'Delete'],
    default: 'Pending'
  }
});

UserSchema.methods.toJSON = function () {
  let User = this;
  let userObject = User.toObject();
  let userInfo = _.pick(userObject, ['_id', 'firstName', 'lastName', 'imageUrl', 'email', 'gender', 'phoneNumber', 'status']);
  userObject.imageUrl && (userInfo.imageUrl = process.env.IP_ADDRESS + '/uploads/' + userObject.imageUrl);
  userInfo.address = _.pick(userObject.address[0], ['location', 'city', 'state', 'country', 'zipCode']);
  if (userObject._role.name) {
    userInfo._role = _.pick(userObject._role, ['_id', 'name']);
  }
  if (userObject._role.name == 'Service Provider') {
    userInfo._serviceProvider = _.pick(userObject._serviceProvider, ['_id', 'name', '_serviceType', '_service']);
  }
  return userInfo;
};

UserSchema.methods.generateAuthToken = function () {
  let User = this;
  let access = 'auth';
  let token = jwt.sign({ _id: User._id.toHexString(), access }, process.env.JWT_SECRET).toString();
  User.tokens.push({ access, token });
  return User.save().then(() => {
    return token;
  });
};

UserSchema.methods.removeToken = function (token) {
  let User = this;
  return User.update({
    $pull: {
      tokens: { token }
    }
  });
};

UserSchema.statics.findByToken = function (token) {
  let User = this;
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return Promise.reject(CONSTANTS.unauthorizedAccess);
  }
  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  })
    .populate('_role')
    .populate({
      path: '_serviceProvider',
      populate: {
        path: '_serviceType',
        model: 'ServiceType'
      }
    });
};

UserSchema.statics.findByCredentials = function (email, password) {
  let User = this;
  return User.findOne({ email })
    .populate('_role', '_id name')
    .populate({
      path: '_serviceProvider',
      select: '_id contactInformation status name establishment description parkingAccess parkingMinutes wheelChairAccess wifiAcces openingTime closingTime address',
      populate:
        {
          path: '_serviceType',
          model: 'ServiceType',
          select: '_id name'
        }
    })
    .populate({
      path: '_serviceProvider',
      populate:
        {
          path: '_service',
          model: 'Service',
          select: '_id name'
        }
    }).then(user => {
      if (!user) {
        return Promise.reject(CONSTANTS.noUserFound);
      }
      return new Promise((resolve, reject) => {
        if (user.status == 'Pending') {
          return reject(CONSTANTS.notActivated);
        }
        bcrypt.compare(password, user.password, (error, res) => {
          if (res) {
            resolve(user);
          } else {
            reject(CONSTANTS.noUserFound);
          }
        });
      });
    });
};

UserSchema.statics.resetPasswordTokenByEmail = function (email) {
  let User = this;
  return User.findOne({ email })
    .then(user => {
      if (!user) {
        return Promise.reject(CONSTANTS.noUserFound);
      }
      return new Promise((resolve, reject) => {
        if (user.status == 'Pending') {
          return reject(CONSTANTS.notActivated);
        }
        crypto.randomBytes(50, function (err, buf) {
          let token = buf.toString('hex');
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000;
          user.save().then(user => {
            return resolve(user);
          }).catch(error => {
            return reject(error);
          });
        });
      });
    });
};

UserSchema.statics.changePassword = function (_id, body) {
  let User = this;
  return User.findById(_id).then(user => {
    return new Promise((resolve, reject) => {
      bcrypt.compare(body.currentPassword, user.password, (error, res) => {
        if (res) {
          user.password = body.password;
          user.save().then(() => {
            return resolve(CONSTANTS.passwordChanged);
          }).catch(error => {
            console.log(error);
            return reject(CONSTANTS.somethingWentWrong);
          });
        } else {
          reject(CONSTANTS.wrongPassword);
        }
      });
    });
  });
};

UserSchema.pre('save', function (next) {
  let User = this;
  if (User.isModified('password')) {
    bcrypt.genSalt(10, (error, salt) => {
      bcrypt.hash(User.password, salt, (error, hash) => {
        User.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

const User = mongoose.model('User', UserSchema);

const basicDetailsPayload = [
  'firstName',
  'lastName',
  'email',
  'password',
  'gender',
  'phoneNumber',
  '_role'
];

const addressPayload = [
  'location',
  'city',
  'state',
  'country',
  'zipCode'
];

module.exports = { User, basicDetailsPayload, addressPayload }
