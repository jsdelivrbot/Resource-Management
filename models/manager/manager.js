const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
    managerId: {
        type: Number,
        required: true
    },
    managerName: {
        type: String,
        require: true,
        lowercase: true
    }
});

const Manager = mongoose.model('Manager', managerSchema);

module.exports = { Manager }