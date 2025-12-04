DROP TABLE IF EXISTS HSLHSReports;

CREATE TABLE HSLHSReports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES Groups(id) ON DELETE CASCADE NOT NULL,
    program_title TEXT NOT NULL,
    submitted_by UUID REFERENCES Users(id) ON DELETE SET NULL,

    -- 1. Prayer Cloud
    prayer_clouds_activated INTEGER DEFAULT 0,
    prayer_clouds_prayed INTEGER DEFAULT 0,
    prayer_cloud_target INTEGER DEFAULT 0,
    total_prayer_clouds INTEGER DEFAULT 0,
    hours_prayed NUMERIC(10, 2) DEFAULT 0.00,
    prayer_outreaches INTEGER DEFAULT 0,

    -- 2. Publicity: On Ground
    magazines_distributed INTEGER DEFAULT 0,
    flyers_distributed INTEGER DEFAULT 0,
    tshirts_printed INTEGER DEFAULT 0,
    healing_outreaches INTEGER DEFAULT 0,

    -- 3. Publicity: Online
    online_souls_reached INTEGER DEFAULT 0,
    online_souls_won INTEGER DEFAULT 0,
    online_views INTEGER DEFAULT 0,
    online_followers INTEGER DEFAULT 0,
    online_comments INTEGER DEFAULT 0,
    online_likes INTEGER DEFAULT 0,
    online_videos_posted INTEGER DEFAULT 0, -- Specific request
    online_flyers_posted INTEGER DEFAULT 0, -- Specific request
    celebrities_reached INTEGER DEFAULT 0,
    dignitaries_reached INTEGER DEFAULT 0,

    -- 4. Publicity: Feedback
    feedback_texts_received INTEGER DEFAULT 0,
    feedback_calls_received INTEGER DEFAULT 0,
    feedback_people_reached_out INTEGER DEFAULT 0,

    -- 5. Penetration: People Reached
    pen_souls_reached_campus INTEGER DEFAULT 0,
    pen_souls_reached_res INTEGER DEFAULT 0,
    pen_souls_reached_hospital INTEGER DEFAULT 0,
    pen_families_reached INTEGER DEFAULT 0,
    pen_souls_won INTEGER DEFAULT 0,

    -- 6. Penetration: Places Reached
    pen_campuses_reached INTEGER DEFAULT 0,
    pen_residences_reached INTEGER DEFAULT 0,
    pen_hospitals_reached INTEGER DEFAULT 0,
    pen_other_centers_visited_list TEXT, -- Text field for list of Orphanages/Schools etc.

    -- 7. Penetration: Registration
    reg_individuals INTEGER DEFAULT 0,
    reg_families INTEGER DEFAULT 0,
    reg_sick_disabled INTEGER DEFAULT 0,

    -- 8. Penetration: Physical Center Registration
    reg_physical_centers INTEGER DEFAULT 0,
    reg_confirmed_strategic_centers INTEGER DEFAULT 0,

    -- 9. Penetration: Herald
    herald_total INTEGER DEFAULT 0,
    herald_bulk_registrations INTEGER DEFAULT 0,
    herald_amplify_registrations INTEGER DEFAULT 0,
    herald_countries_amplified INTEGER DEFAULT 0,
    herald_total_zonal_registrations INTEGER DEFAULT 0,

    -- 10. Partnership
    partnership_total_amount DECIMAL(12, 2) DEFAULT 0.00,
    partnership_new_partners INTEGER DEFAULT 0,
    partnership_helper_initiatives INTEGER DEFAULT 0,
    partnership_total_partners INTEGER DEFAULT 0,

    -- 11. Attendance: Centers Count
    att_physical_centers_count INTEGER DEFAULT 0,
    att_family_centers_count INTEGER DEFAULT 0,
    att_virtual_centers_count INTEGER DEFAULT 0,
    att_hospital_centers_count INTEGER DEFAULT 0,
    att_targeted_countries_count INTEGER DEFAULT 0,

    -- 12. Attendance: Headcounts
    att_total_physical_center INTEGER DEFAULT 0,
    att_total_family_center INTEGER DEFAULT 0,
    att_total_virtual_center INTEGER DEFAULT 0,
    att_total_hospital_center INTEGER DEFAULT 0,
    att_total_other_center INTEGER DEFAULT 0,
    att_total_individual INTEGER DEFAULT 0,
    att_total_first_timers INTEGER DEFAULT 0,
    att_total_new_converts INTEGER DEFAULT 0,
    att_testimonies INTEGER DEFAULT 0,
    att_general_total INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE (group_id, program_title)
);