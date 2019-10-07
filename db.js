const spicedPg = require("spiced-pg");
const db = spicedPg(`postgres:postgres:postgres@localhost:5432/petition`);

module.exports.addSignature = (newEntry, callbacks) => {
    let { first_name, last_name, email, signature } = newEntry;
    return db
        .query(
            `INSERT INTO signatures (first_name, last_name, email, signature)
        VALUES ($1, $2, $3, $4) RETURNING id`,
            [first_name, last_name, email, signature]
        )
        .then(sqlTab => callbacks.success(sqlTab.rows[0].id))
        .catch(err => callbacks.error(err));
};

module.exports.getSigners = callbacks => {
    return db
        .query(`SELECT first_name, last_name FROM signatures`)
        .then(sqlTab => callbacks.success(sqlTab.rows))
        .catch(err => callbacks.error(err));
};

module.exports.getSignature = (id, callbacks) => {
    return db
        .query(`SELECT signature FROM signatures WHERE id = $1`, [id])
        .then(sqlTab => callbacks.success(sqlTab.rows[0].signature))
        .catch(err => callbacks.error(err));
};
