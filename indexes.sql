-- Indexes for Users and Roles lookup
CREATE INDEX idx_users_chapter_id ON Users(chapter_id);
CREATE INDEX idx_userroles_user_id ON UserRoles(user_id);

-- Indexes for Sunday Service Reports
CREATE INDEX idx_sunday_reports_event_id ON SundayServiceReports(event_id);
CREATE INDEX idx_sunday_reports_chapter_id ON SundayServiceReports(chapter_id);

-- Indexes for Camp Reports
CREATE INDEX idx_camp_attendance_camp_id ON CampChapterAttendance(camp_id);
CREATE INDEX idx_camp_summaries_camp_id ON CampGroupSummaries(camp_id);
CREATE INDEX idx_camp_attendees_camp_group ON CampAttendees(camp_id, group_id); -- Compound index for filtering

-- Indexes for PFCC Reports
CREATE INDEX idx_pfcc_report_date ON PFCCReports(report_date);
CREATE INDEX idx_pfcc_leader_id ON PFCCReports(cell_leader_id);

-- Indexes for Finance Reports
CREATE INDEX idx_finance_monthly_group_date ON FinanceMonthlyGroupReports(group_id, report_month);
CREATE INDEX idx_finance_pastor_tithe ON FinancePastorTitheRecords(pastor_user_id, record_year);
CREATE INDEX idx_finance_individual_records ON FinanceIndividualRecords(group_id, record_year);

-- Indexes for Ministry Materials
CREATE INDEX idx_books_category ON Books(category);
CREATE INDEX idx_mm_reports_group_date ON MinistryMaterialBookReports(group_id, report_month);

-- Indexes for HSLHS
CREATE INDEX idx_hslhs_group_program ON HSLHSReports(group_id, program_title);