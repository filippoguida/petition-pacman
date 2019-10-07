const spicedPg = require("spiced-pg");
const db = spicedPg(`postgres:postgres:postgres@localhost:5432/practice`);

module.exports.addSignature = (firstName, lastName, email, signature) => {
    return db.query(
        `INSERT INTO signatures (first_name, last_name, email, signature)
        VALUES ($1, $2, $3, 4)`,
        [firstName, lastName, email, signature]
    );
};

module.exports.getSignatures = () => {
    return db.query(`SELECT * FROM signatures`);
};
