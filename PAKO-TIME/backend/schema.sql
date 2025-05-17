CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tracking (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    subcategory_id INTEGER REFERENCES subcategories(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);
