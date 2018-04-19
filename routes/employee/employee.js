const express = require('express');
const router = express.Router();
const _ = require('lodash');
const { ObjectID } = require('mongodb');

const { CONSTANTS } = require('../../constants/constants');
const { Employee } = require('../../models/employee/employee');

router.post('/', (req, res) => {
    const employee = new Employee(req.body);
    employee.save().then(() => {
        return res.status(200).json({ message: CONSTANTS.empSuccess });
    }).catch(error => {
        return res.status(400).json({ message: CONSTANTS.empFailed });
    });
});

router.get('/', (req, res) => {
    const condition = {};
    if(req.query.empid){
        condition.empId = req.query.empid;
        condition.employeeStatus = CONSTANTS.active;
    }else {
        condition.employeeStatus = CONSTANTS.active;
    }
    Employee.find(condition)
    .populate('_projects')
    .then(employees => {
        res.status(200).json(employees);
    }).catch(error => {
        res.status(400).json({ message: CONSTANTS.empGETFailed });
    });
});

// router.post('/search', (req, res) => {
//     Employee.find({$and:[{employeeStatus: CONSTANTS.active},{$or:[{firstName: _.toLower(req.body.fname) },{lastName: _.toLower(req.body.lname)}]}]})
//     .populate('_projects')
//     .then(employees => {
//         res.status(200).json(employees);
//     }).catch(error => {
//         res.status(400).json({ message: CONSTANTS.empGETFailed });
//     });
// });

router.delete('/', (req, res) => {
    Employee.findOneAndUpdate({ empId: req.body.empId, employeeStatus: CONSTANTS.active }, { $set: { employeeStatus: CONSTANTS.inactive } }, { new: true })
    .then(employee => {
        res.status(200).json({message: CONSTANTS.empDeleteSuccess});
    }).catch(error => {
        res.status(400).json({ message: CONSTANTS.empDeleteFail });
    });
});

router.put('/', (req, res) => {
    const body = _.pick(req.body, ['empId', 'firstName', 'lastName', 'location', 'age', '_projects']);
    Employee.findOneAndUpdate({ empId: req.body.empId, employeeStatus: CONSTANTS.active }, { $set: body }, { new: true })
    .then(employee => {
        res.status(200).json({message: CONSTANTS.empUptdSuccess, employee: employee});
    }).catch(error => {
        res.status(400).json({ message: CONSTANTS.empUptdFail });
    });
});

module.exports = router;