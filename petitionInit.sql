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
    id INT references users(id) primary key,
    signature TEXT NOT NULL
);

DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE TABLE user_profiles(
    id INT references users(id) primary key,
    age INT,
    city VARCHAR,
    url VARCHAR
);
