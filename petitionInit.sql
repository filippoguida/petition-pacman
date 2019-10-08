DROP TABLE IF EXISTS signatures;
CREATE TABLE signatures (
    userId SERIAL primary key,
    signature TEXT NOT NULL
);

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id SERIAL primary key,
    first_name  VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);
