const spicedPg = require("spiced-pg");
const crypt = require("./crypt");
const db = spicedPg(`postgres:postgres:postgres@localhost:5432/petition`);

module.exports.addUser = body => {
    return new Promise((resolve, reject) => {
        let { first_name, last_name, email, password } = body;
        crypt
            .hash(password)
            .then(hash => {
                db.query(
                    `INSERT INTO users (first_name, last_name, email, password)
                VALUES ($1, $2, $3, $4) RETURNING id`,
                    [first_name, last_name, email, hash]
                )
                    .then(sqlTab => resolve(sqlTab.rows[0].id))
                    .catch(err => reject(err));
            })
            .catch(err => reject(err));
    });
};

module.exports.getUserId = body => {
    return new Promise((resolve, reject) => {
        let { email, password } = body;
        db.query(`SELECT password FROM users WHERE email = $1`, [email])
            .then(sqlTab => {
                let hash = sqlTab.rows[0].password;
                crypt.compare(password, hash).then(logRes => {
                    if (!logRes) reject("Permission Denied");
                    else
                        db.query(
                            `SELECT id FROM users WHERE email = $1 AND password = $2`,
                            [email, hash]
                        )
                            .then(sqlTab => resolve(sqlTab.rows[0].id))
                            .catch(err => reject(err));
                });
            })
            .catch(err => reject(err));
    });
};

module.exports.addSignature = body => {
    return new Promise((resolve, reject) => {
        let { id, signature } = body;
        db.query(
            `INSERT INTO signatures (id, signature) VALUES ($1, $2) RETURNING signature`,
            [id, signature]
        )
            .then(sqlTab => resolve(sqlTab.rows[0].signature))
            .catch(err => reject(err));
    });
};

module.exports.getSignature = id => {
    return new Promise((resolve, reject) => {
        db.query(`SELECT signature FROM signatures WHERE id = $1`, [id])
            .then(sqlTab => resolve(sqlTab.rows[0].signature))
            .catch(err => reject(err));
    });
};

module.exports.getSigners = () => {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT users.first_name, users.last_name FROM users, signatures WHERE users.id = signatures.id`
        )
            .then(sqlTab => resolve(sqlTab.rows))
            .catch(err => reject(err));
    });
};
