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

CREATE TABLE counters(
    id TEXT PRIMARY KEY,
    value INTEGER  
);
INSERT INTO counters (id, value) values ('link_counter', 0);
UPDATE counters SET value=value+1 WHERE id='link_counter' RETURNING value;

