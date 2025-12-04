-- Create the Groups table
CREATE TABLE
    Groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        group_name TEXT UNIQUE NOT NULL
    );

-- Create the Chapters table
CREATE TABLE
    Chapters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        chapter_name TEXT UNIQUE NOT NULL,
        group_id UUID REFERENCES Groups (id) ON DELETE SET NULL
    );

-- Create the Roles table
CREATE TABLE
    Roles (
        id SERIAL PRIMARY KEY,
        role_name TEXT UNIQUE NOT NULL
    );

-- Create the Users table
CREATE TABLE
    Users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        kingschat_username TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT,
        contact_number TEXT,
        chapter_id UUID REFERENCES Chapters (id),
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW ()
    );

-- Create the linking table for Users and Roles
CREATE TABLE
    UserRoles (
        user_id UUID REFERENCES Users (id) ON DELETE CASCADE,
        role_id INTEGER REFERENCES Roles (id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_id)
    );