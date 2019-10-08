const spicedPg = require("spiced-pg");
const crypt = require("./crypt");
const db = spicedPg(`postgres:postgres:postgres@localhost:5432/petition`);

module.exports.addUser = (body, callbacks) => {
    let { first_name, last_name, email, password } = body;
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

module.exports.getUserToken = (body, callbacks) => {
    let { email, password } = body;
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

module.exports.addSignature = (body, callbacks) => {
    let { id, signature } = body;
    return db
        .query(
            `INSERT INTO signatures (id, signature) VALUES ($1, $2) RETURNING signature`,
            [id, signature]
        )
        .then(sqlTab => callbacks.success(sqlTab.rows[0].signature))
        .catch(err => callbacks.error(err));
};

module.exports.getSignature = (id, callbacks) => {
    db.query(`SELECT signature FROM signatures WHERE id = $1`, [id])
        .then(sqlTab => callbacks.success(sqlTab.rows[0].signature))
        .catch(err => callbacks.error(err));
};

module.exports.getSigners = callbacks => {
    return db
        .query(
            `SELECT users.first_name, users.last_name FROM users, signatures WHERE users.id = signatures.id`
        )
        .then(sqlTab => callbacks.success(sqlTab.rows))
        .catch(err => callbacks.error(err));
};
