-- Table to store weekly cell reports submitted by Cell Leaders/Assistants
CREATE TABLE PFCCReports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cell_leader_id UUID REFERENCES Users(id) ON DELETE CASCADE NOT NULL, -- The user record of the cell leader
    report_date DATE NOT NULL, -- The specific date the report is for (e.g., the day of the meeting)
    cell_name TEXT NOT NULL,
    cell_attendance INTEGER NOT NULL DEFAULT 0,
    cell_first_timers INTEGER NOT NULL DEFAULT 0,
    new_converts INTEGER NOT NULL DEFAULT 0,
    offering DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    cell_church_attendance INTEGER NOT NULL DEFAULT 0,
    cell_church_first_timers INTEGER NOT NULL DEFAULT 0,
    souls_reached INTEGER NOT NULL DEFAULT 0,
    souls_saved INTEGER NOT NULL DEFAULT 0,
    souls_retained INTEGER NOT NULL DEFAULT 0,
    submitted_by UUID REFERENCES Users(id) ON DELETE SET NULL, -- Who actually filled the form
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- A cell leader can only submit one report for a specific date.
    -- This allows editing by re-submitting for the same date.
    UNIQUE (cell_leader_id, report_date)
);