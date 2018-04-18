const mongoose = require('mongoose');

const { Manager } = require('../manager/manager');

const projectSchema = new mongoose.Schema({
    projectId: {
        type: Number,
        required: true
    },
    projectName: {
        type: String,
        require: true
    },
    _manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manager'
    }
});

const Project = mongoose.model('Project', projectSchema);

module.exports = { Project }