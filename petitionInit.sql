DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users
(
    id SERIAL primary key,
    first_name  VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

DROP TABLE IF EXISTS signatures CASCADE;
CREATE TABLE signatures
(
    id INT references users(id),
    signature TEXT NOT NULL
);
