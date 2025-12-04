-- Table for the main Monthly Finance Report submitted by a Group Finance Officer
CREATE TABLE
    FinanceMonthlyGroupReports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        group_id UUID REFERENCES Groups (id) ON DELETE CASCADE NOT NULL,
        report_month DATE NOT NULL, -- The first day of the month, e.g., '2025-11-01'
        submitted_by UUID REFERENCES Users (id) ON DELETE SET NULL,
        general_offerings DECIMAL(12, 2) DEFAULT 0.00,
        seed_offerings DECIMAL(12, 2) DEFAULT 0.00,
        alter_seeds DECIMAL(12, 2) DEFAULT 0.00,
        tithes DECIMAL(12, 2) DEFAULT 0.00,
        first_fruits DECIMAL(12, 2) DEFAULT 0.00,
        thanksgiving DECIMAL(12, 2) DEFAULT 0.00,
        communion_offering DECIMAL(12, 2) DEFAULT 0.00,
        number_of_tithers INTEGER DEFAULT 0,
        number_of_new_tithers INTEGER DEFAULT 0,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            last_updated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            -- A group can only have one finance report per month
            UNIQUE (group_id, report_month)
    );

-- Table for Pastors' tithe records, managed per group
CREATE TABLE
    FinancePastorTitheRecords (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        pastor_user_id UUID REFERENCES Users (id) ON DELETE CASCADE NOT NULL, -- The user record for the pastor
        group_id UUID REFERENCES Groups (id) ON DELETE CASCADE NOT NULL, -- The group this record belongs to
        record_year INTEGER NOT NULL,
        submitted_by UUID REFERENCES Users (id) ON DELETE SET NULL,
        first_fruits DECIMAL(12, 2) DEFAULT 0.00,
        jan_tithe DECIMAL(12, 2) DEFAULT 0.00,
        feb_tithe DECIMAL(12, 2) DEFAULT 0.00,
        mar_tithe DECIMAL(12, 2) DEFAULT 0.00,
        apr_tithe DECIMAL(12, 2) DEFAULT 0.00,
        may_tithe DECIMAL(12, 2) DEFAULT 0.00,
        jun_tithe DECIMAL(12, 2) DEFAULT 0.00,
        jul_tithe DECIMAL(12, 2) DEFAULT 0.00,
        aug_tithe DECIMAL(12, 2) DEFAULT 0.00,
        sep_tithe DECIMAL(12, 2) DEFAULT 0.00,
        oct_tithe DECIMAL(12, 2) DEFAULT 0.00,
        nov_tithe DECIMAL(12, 2) DEFAULT 0.00,
        dec_tithe DECIMAL(12, 2) DEFAULT 0.00,
        last_updated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            -- A pastor can only have one tithe record per year
            UNIQUE (pastor_user_id, record_year)
    );

-- Table for individual member records, populated by Excel/CSV upload
CREATE TABLE
    FinanceIndividualRecords (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        group_id UUID REFERENCES Groups (id) ON DELETE SET NULL,
        chapter_id UUID REFERENCES Chapters (id) ON DELETE SET NULL,
        title TEXT,
        full_name TEXT NOT NULL,
        contact_number TEXT,
        leadership_role TEXT,
        is_new_tither BOOLEAN DEFAULT FALSE,
        record_year INTEGER NOT NULL,
        first_fruits DECIMAL(12, 2) DEFAULT 0.00,
        thanksgiving DECIMAL(12, 2) DEFAULT 0.00,
        jan_tithe DECIMAL(12, 2) DEFAULT 0.00,
        feb_tithe DECIMAL(12, 2) DEFAULT 0.00,
        mar_tithe DECIMAL(12, 2) DEFAULT 0.00,
        apr_tithe DECIMAL(12, 2) DEFAULT 0.00,
        may_tithe DECIMAL(12, 2) DEFAULT 0.00,
        jun_tithe DECIMAL(12, 2) DEFAULT 0.00,
        jul_tithe DECIMAL(12, 2) DEFAULT 0.00,
        aug_tithe DECIMAL(12, 2) DEFAULT 0.00,
        sep_tithe DECIMAL(12, 2) DEFAULT 0.00,
        oct_tithe DECIMAL(12, 2) DEFAULT 0.00,
        nov_tithe DECIMAL(12, 2) DEFAULT 0.00,
        dec_tithe DECIMAL(12, 2) DEFAULT 0.00,
        uploaded_by UUID REFERENCES Users (id) ON DELETE SET NULL
    );

-- Table for Zonal Remittance reports, submitted by Zonal Admin
CREATE TABLE
    ZonalRemittances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        item_name TEXT NOT NULL, -- e.g., 'First Fruits', 'Zonal Dues'
        record_year INTEGER NOT NULL,
        submitted_by UUID REFERENCES Users (id) ON DELETE SET NULL,
        jan_amount DECIMAL(12, 2) DEFAULT 0.00,
        feb_amount DECIMAL(12, 2) DEFAULT 0.00,
        mar_amount DECIMAL(12, 2) DEFAULT 0.00,
        apr_amount DECIMAL(12, 2) DEFAULT 0.00,
        may_amount DECIMAL(12, 2) DEFAULT 0.00,
        jun_amount DECIMAL(12, 2) DEFAULT 0.00,
        jul_amount DECIMAL(12, 2) DEFAULT 0.00,
        aug_amount DECIMAL(12, 2) DEFAULT 0.00,
        sep_amount DECIMAL(12, 2) DEFAULT 0.00,
        oct_amount DECIMAL(12, 2) DEFAULT 0.00,
        nov_amount DECIMAL(12, 2) DEFAULT 0.00,
        dec_amount DECIMAL(12, 2) DEFAULT 0.00,
        last_updated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            -- Can only have one record for a specific item per year
            UNIQUE (item_name, record_year)
    );