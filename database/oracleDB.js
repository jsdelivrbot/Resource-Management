const oracledb = require('oracledb');

let db;
const oracleConnect = async () => {
    if (!db) {
        db = await oracledb.getConnection({
            user: process.env.user,
            password: process.env.password,
            connectString: process.env.connectString
        });
    }
    return db;
};

module.exports = oracleConnect();