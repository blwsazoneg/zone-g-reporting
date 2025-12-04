-- A central table to manage all available books, their categories, and prices
CREATE TABLE
    Books (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        book_title TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL, -- e.g., 'Adult', 'Children', 'Bible Story', etc.
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        created_by UUID REFERENCES Users (id) ON DELETE SET NULL,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW ()
    );

-- Table for the monthly report of books ordered by each group
CREATE TABLE
    MinistryMaterialBookReports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        group_id UUID REFERENCES Groups (id) ON DELETE CASCADE NOT NULL,
        report_month DATE NOT NULL, -- First day of the month, e.g., '2025-11-01'
        books_ordered INTEGER DEFAULT 0,
        mini_books_ordered INTEGER DEFAULT 0,
        total_amount DECIMAL(12, 2) DEFAULT 0.00,
        -- A text field for the names of books, as the request is simple
        book_names_details TEXT,
        submitted_by UUID REFERENCES Users (id) ON DELETE SET NULL,
        last_updated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            -- A group can only have one report per month
            UNIQUE (group_id, report_month)
    );

-- Table to store individual PCDL subscription records
CREATE TABLE
    PcdlSubscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        group_id UUID REFERENCES Groups (id) ON DELETE SET NULL,
        chapter_id UUID REFERENCES Chapters (id) ON DELETE SET NULL,
        title TEXT,
        full_name TEXT NOT NULL,
        contact_number TEXT,
        kc_handle TEXT, -- KingsChat Handle
        leadership_role TEXT,
        subscription_type TEXT, -- e.g., '1 Month', '3 Month', '6 Month'
        commitment TEXT,
        submitted_by UUID REFERENCES Users (id) ON DELETE SET NULL,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW ()
    );