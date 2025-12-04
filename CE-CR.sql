-- Main table for a specific camp event
CREATE TABLE
    CampEvents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        camp_title TEXT NOT NULL,
        start_date DATE,
        end_date DATE,
        created_by UUID REFERENCES Users (id) ON DELETE SET NULL,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW ()
    );

-- Table for chapter-level daily attendance reports
CREATE TABLE
    CampChapterAttendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        camp_id UUID REFERENCES CampEvents (id) ON DELETE CASCADE NOT NULL,
        chapter_id UUID REFERENCES Chapters (id) ON DELETE CASCADE NOT NULL,
        submitted_by UUID REFERENCES Users (id) ON DELETE SET NULL,
        report_date DATE NOT NULL,
        attendance_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            last_updated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            -- Ensure a chapter can only submit one attendance report per day for a camp
            UNIQUE (camp_id, chapter_id, report_date)
    );

-- Table for group-level summary reports (pastors, leaders, baptism, etc.)
CREATE TABLE
    CampGroupSummaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        camp_id UUID REFERENCES CampEvents (id) ON DELETE CASCADE NOT NULL,
        group_id UUID REFERENCES Groups (id) ON DELETE CASCADE NOT NULL,
        submitted_by UUID REFERENCES Users (id) ON DELETE SET NULL,
        total_pastors INTEGER DEFAULT 0,
        total_coordinators INTEGER DEFAULT 0,
        total_leaders INTEGER DEFAULT 0,
        total_members INTEGER DEFAULT 0,
        total_first_timers INTEGER DEFAULT 0,
        total_baptised INTEGER DEFAULT 0,
        last_updated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            -- Ensure a group only submits one summary report per camp
            UNIQUE (camp_id, group_id)
    );

-- Table to store individual attendee data from the Excel upload
CREATE TABLE
    CampAttendees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        camp_id UUID REFERENCES CampEvents (id) ON DELETE CASCADE NOT NULL,
        group_id UUID REFERENCES Groups (id) ON DELETE SET NULL, -- Use group_id for easier filtering
        title TEXT,
        full_name TEXT NOT NULL,
        chapter_name TEXT, -- Storing as text as it comes from Excel
        got_tshirt BOOLEAN DEFAULT false,
        uploaded_by UUID REFERENCES Users (id) ON DELETE SET NULL,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW ()
    );