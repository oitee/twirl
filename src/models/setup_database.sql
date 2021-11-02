\c postgres;
DROP DATABASE IF EXISTS twirl;
CREATE DATABASE twirl;
\connect twirl;

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    role_id INTEGER REFERENCES roles (id)
);

INSERT INTO roles (name) values ('admin') , ('normal'), ('superAdmin');

INSERT INTO users values ('931c49f9-624c-4e01-8c15-fe0e4e4e8cf7', 'Peter', 'testpwd', current_timestamp, 1);

INSERT INTO users values ('590cbbb3-c184-4d64-8bc6-5101e4fc0073', 'John','testpwd', current_timestamp, 2);

