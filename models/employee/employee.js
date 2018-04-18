const mongoose = require('mongoose');

const { Project } = require('../project/project');

const employeeSchema = new mongoose.Schema({
    empId: {
        type: Number,
        required: true
    },
    firstName: {
        type: String,
        require: true,
        lowercase: true
    },
    lastName : {
        type: String,
        required: true,
        lowercase: true
    },
    location: {
        type: String,
        default: 'HYD'
    },
    age:{
        type: Number,
        required: true
    },
    _projects: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project'
        }
    ],
    employeeStatus: {
        type: String,
        enum: ['Active','InActive'],
        default: 'Active'
    }
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = { Employee }