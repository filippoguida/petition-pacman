const spicedPg = require("spiced-pg");
const crypt = require("./crypt");
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

module.exports.addUser = (newEntry, callbacks) => {
    let { first_name, last_name, email, password } = newEntry;
    return crypt
        .hash(password)
        .then(hash => {
            db.query(
                `INSERT INTO users (first_name, last_name, email, password)
        VALUES ($1, $2, $3, $4) RETURNING id`,
                [first_name, last_name, email, hash]
            )
                .then(sqlTab => callbacks.success(sqlTab.rows[0].id))
                .catch(err => callbacks.error(err));
        })
        .catch(() => callbacks.error("Encryption Failed"));
};

module.exports.getUserToken = (newEntry, callbacks) => {
    let { email, password } = newEntry;
    return db
        .query(`SELECT password FROM users WHERE email = $1`, [email])
        .then(sqlTab => {
            let hash = sqlTab.rows[0].password;
            crypt.compare(password, hash).then(logRes => {
                if (!logRes) callbacks.error("Permission Denied");
                else
                    db.query(
                        `SELECT id FROM users WHERE email = $1 AND password = $2`,
                        [email, hash]
                    )
                        .then(sqlTab => callbacks.success(sqlTab.rows[0].id))
                        .catch(err => callbacks.error(err));
            });
        })
        .catch(err => callbacks.error(err));
};
