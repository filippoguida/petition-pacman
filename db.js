const spicedPg = require("spiced-pg");
const db = spicedPg(`postgres:postgres:postgres@localhost:5432/petition`);

module.exports.addSignature = newEntry => {
    let { firstName, lastName, email, signature } = newEntry;
    return db.query(
        `INSERT INTO signatures (first_name, last_name, email, signature)
        VALUES ($1, $2, $3, $4)`,
        [firstName, lastName, email, signature]
    );
};

module.exports.getSignatures = () => {
    return db.query(`SELECT * FROM signatures`);
};
