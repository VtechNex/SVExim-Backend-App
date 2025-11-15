CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    access_token TEXT,
    access_token_expires TIMESTAMP,
    refresh_token TEXT,
    refresh_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);


CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(255) UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2),
    currency VARCHAR(10),
    images JSONB,
    quantity NUMERIC(10, 2),
    condition VARCHAR(50),
    statusColor VARCHAR(50),
    brand VARCHAR(100),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  name varchar(255) NOT NULL,
  description text DEFAULT NULL,
  logo_url text DEFAULT NULL
);


-- CREATE TABLE quotes (
--     id SERIAL PRIMARY KEY,
--     product_id INT REFERENCES products(id) ON DELETE CASCADE,
--     admin_id INT REFERENCES admins(id) ON DELETE SET NULL,
--     parent_id INT REFERENCES quotes(id) ON DELETE CASCADE,
--     content TEXT NOT NULL,
--     created_at TIMESTAMP DEFAULT now()
-- );

