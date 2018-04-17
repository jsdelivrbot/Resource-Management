const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  permissions: [
    {
      view: {
        type: String,
        trim: true,
        require: true
      },
      privilages:
        {
          create: {
            type: Boolean,
            enum: [true, false],
            default: false
          },
          read: {
            type: Boolean,
            enum: [true, false],
            default: true
          },
          update: {
            type: Boolean,
            enum: [true, false],
            default: false
          },
          delete: {
            type: Boolean,
            enum: [true, false],
            default: false
          }
        }
    }
  ],
  status: {
    type: String,
    default: 'Active'
  }
});

const Role = mongoose.model('Role', RoleSchema);

module.exports = { Role }