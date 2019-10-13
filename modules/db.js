const spicedPg = require("spiced-pg");
const crypt = require("./crypt");
const db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:postgres:postgres@localhost:5432/petition`
);

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
            `INSERT INTO signatures (id, signature)
            VALUES ($1, $2) RETURNING signature`,
            [id, signature]
        )
            .then(sqlTab => resolve(sqlTab.rows[0].signature))
            .catch(err => reject(err));
    });
};

module.exports.deleteSignature = id => {
    return new Promise((resolve, reject) => {
        db.query(`DELETE FROM signatures WHERE id = $1`, [id])
            .then(() => resolve(true))
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

module.exports.getSigners = body => {
    return new Promise((resolve, reject) => {
        let { city } = sanitizeUserData(body);
        if (city)
            db.query(
                `SELECT first_name, last_name, age, city
                FROM users AS u
                INNER JOIN user_profiles AS up
                ON u.id = up.id AND up.city = $1`,
                [city]
            )
                .then(sqlTab => resolve(sqlTab.rows))
                .catch(err => reject(err));
        else
            db.query(
                `SELECT first_name, last_name, age, city
                FROM users AS u
                INNER JOIN user_profiles AS up
                ON u.id = up.id AND up.city IS NOT NULL`
            )
                .then(sqlTab => resolve(sqlTab.rows))
                .catch(err => reject(err));
    });
};

module.exports.getUserData = id => {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT first_name, last_name, email FROM users
            WHERE id = $1`,
            [id]
        )
            .then(sqlTab1 =>
                db
                    .query(
                        `SELECT age, city, url FROM user_profiles
                         WHERE id = $1`,
                        [id]
                    )
                    .then(sqlTab2 =>
                        resolve({ ...sqlTab1.rows[0], ...sqlTab2.rows[0] })
                    )
                    .catch(err => reject(err))
            )
            .catch(err => reject(err));
    });
};

module.exports.setUserData = (id, body) => {
    let { first_name, last_name, email } = body;
    db.query(
        `UPDATE users SET
            first_name = COALESCE($2, first_name),
            last_name = COALESCE($3, last_name),
            email = COALESCE($4, email)
         WHERE id = $1`,
        [id, first_name, last_name, email]
    ).then(() => {
        let { age, city, url } = sanitizeUserData(body);
        db.query(
            `INSERT INTO
                user_profiles (id, age, url, city)
             VALUES
                ($1, $2, $3, $4) ON CONFLICT (id)
             DO UPDATE SET
                age = COALESCE($2, user_profiles.age),
                url = COALESCE($3, user_profiles.url),
                city = COALESCE($4, user_profiles.city)`,
            [id, age, url, city]
        );
    });
    if (body.password)
        crypt.hash(body.password).then(hash =>
            db.query(
                `UPDATE users SET
                    password = COALESCE($2, password)
                 WHERE id = $1`,
                [id, hash]
            )
        );
};

function sanitizeUserData(body) {
    body = body || {};
    body.age = body.age || "";
    body.age = parseInt(body.age);
    body.city = body.city || "";
    body.city = body.city.charAt(0).toUpperCase() + body.city.slice(1) || "";
    function validURL(str) {
        var pattern = new RegExp(
            "^(https?:\\/\\/)?" + // protocol
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
            "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
            "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
                "(\\#[-a-z\\d_]*)?$",
            "i"
        ); // fragment locator
        return !!pattern.test(str);
    }
    body.url = body.url || "";
    body.url = validURL(body.url) ? body.url : "";
    return body;
}
