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

module.exports.addUserProfile = (id, body) => {
    return new Promise((resolve, reject) => {
        let { age, city, url } = body;
        age = parseInt(age);
        city = city.toLowerCase();
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
        url = validURL(url) ? url : "";
        console.log(age, city, url);
        db.query(
            `INSERT INTO user_profiles (id, age, city, url) VALUES ($1, $2, $3, $4)`,
            [id, age, city, url]
        ).catch(err => reject(err));
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
    let cityCond = body ? `AND up.city = '${body.city}'` : "";
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT first_name, last_name, age, city FROM users AS u INNER JOIN user_profiles AS up ON u.id = up.id ${cityCond}`
        )
            .then(sqlTab => resolve(sqlTab.rows))
            .catch(err => reject(err));
    });
};

module.exports.getUserData = id => {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT first_name, last_name, email, password, age, city, url FROM users AS u INNER JOIN user_profiles AS up ON u.id = ${id} AND up.id = ${id}`
        )
            .then(sqlTab => resolve(sqlTab.rows[0]))
            .catch(err => reject(err));
    });
};

module.exports.setUserData = (id, body) => {
    db.query(
        `UPDATE users SET
            first_name = COALESCE(${body.first_name}, first_name),
            last_name = COALESCE(${body.last_name}, last_name),
            email = COALESCE(${body.email}, email),
            WHERE id = ${id};
        UPDATE user_profiles SET
            age = COALESCE(${body.age}, age),
            url = COALESCE(${body.url}, url),
            city = COALESCE(${body.city}, city)
            WHERE id = ${id}`
    );
    if (body.password)
        crypt.hash(body.password).then(hash =>
            db.query(
                `UPDATE users SET
                    password = COALESCE(${hash}, password)
                    WHERE id = ${id}`
            )
        );
};
