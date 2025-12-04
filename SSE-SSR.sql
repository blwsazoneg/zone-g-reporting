-- Table to store the main event, created by Zonal Admin/Developer
CREATE TABLE SundayServiceEvents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_title TEXT NOT NULL,
    event_date DATE NOT NULL,
    -- 'created_by' is a good practice for auditing
    created_by UUID REFERENCES Users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store the report submitted by each chapter for a specific event
CREATE TABLE SundayServiceReports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES SundayServiceEvents(id) ON DELETE CASCADE NOT NULL, -- If event is deleted, reports are deleted
    chapter_id UUID REFERENCES Chapters(id) ON DELETE CASCADE NOT NULL, -- If chapter is deleted, reports are deleted
    submitted_by UUID REFERENCES Users(id) ON DELETE SET NULL,
    attendance INTEGER NOT NULL DEFAULT 0,
    first_timers INTEGER NOT NULL DEFAULT 0,
    new_converts INTEGER NOT NULL DEFAULT 0,
    holy_ghost_filled INTEGER NOT NULL DEFAULT 0,
    offering DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- Allows for larger values, up to 9,999,999,999.99
    tithe DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- This ensures a chapter can only submit one report per event
    UNIQUE (event_id, chapter_id)
);