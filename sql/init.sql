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
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2),
    currency VARCHAR(10),
    ebay_id VARCHAR(255) UNIQUE,
    images JSONB,
    attributes JSONB,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);


CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    admin_id INT REFERENCES admins(id) ON DELETE SET NULL,
    parent_id INT REFERENCES quotes(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE products ADD CONSTRAINT unique_ebay_id UNIQUE (ebay_id);
