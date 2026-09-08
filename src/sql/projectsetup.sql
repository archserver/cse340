-- ---------------------------------------------------------------------------
-- projectsetup.sql - creates and seeds the projects table.
--
-- Depends on orgsetup.sql having been run first: the foreign key below requires
-- the organization table to exist, and the seed rows resolve each organization
-- by name rather than by a hardcoded id.
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS projects;

CREATE TABLE projects (
    project_id       SERIAL        PRIMARY KEY,

    -- Foreign key to organization. PostgreSQL now rejects any project whose
    -- organization_id has no matching row, so the relationship is enforced by
    -- the database rather than by application code. ON DELETE CASCADE means
    -- removing an organization also removes its projects, since a project with
    -- no organization would be meaningless.
    organization_id  INT           NOT NULL
                                   REFERENCES organization (organization_id)
                                   ON DELETE CASCADE,

    title            VARCHAR(150)  NOT NULL,
    description      TEXT          NOT NULL,
    location         VARCHAR(255)  NOT NULL,

    -- Named event_date rather than date: `date` is also a PostgreSQL type name,
    -- which makes queries harder to read even though it is legal as a column.
    event_date       DATE          NOT NULL
);

-- Each row resolves its organization with a subquery on the name. Hardcoding
-- 1, 2, 3 would work today but breaks if the organizations are ever re-seeded
-- in a different order.
INSERT INTO projects (organization_id, title, description, location, event_date)
VALUES
-- BrightFuture Builders
((SELECT organization_id FROM organization WHERE name = 'BrightFuture Builders'),
 'Riverside Community Center Rebuild',
 'Volunteers rebuilt the flood-damaged community center using reclaimed and sustainably sourced materials.',
 'Rexburg, ID', '2026-03-14'),
((SELECT organization_id FROM organization WHERE name = 'BrightFuture Builders'),
 'Accessible Ramp Installation',
 'Designed and installed wheelchair ramps for twelve homes belonging to residents with limited mobility.',
 'Idaho Falls, ID', '2026-05-02'),
((SELECT organization_id FROM organization WHERE name = 'BrightFuture Builders'),
 'Solar Panel Barn Raising',
 'Installed a rooftop solar array on a shared agricultural storage facility to cut long-term energy costs.',
 'Sugar City, ID', '2026-06-20'),
((SELECT organization_id FROM organization WHERE name = 'BrightFuture Builders'),
 'Neighborhood Playground Restoration',
 'Replaced aging playground equipment and poured a new safety surface at a neighborhood park.',
 'Rigby, ID', '2026-08-15'),
((SELECT organization_id FROM organization WHERE name = 'BrightFuture Builders'),
 'Reclaimed Lumber Workshop',
 'Taught volunteers how to salvage, mill, and reuse construction lumber that would otherwise be discarded.',
 'Rexburg, ID', '2026-10-03'),

-- GreenHarvest Growers
((SELECT organization_id FROM organization WHERE name = 'GreenHarvest Growers'),
 'Downtown Rooftop Garden',
 'Converted an unused commercial rooftop into a productive vegetable garden serving nearby food pantries.',
 'Idaho Falls, ID', '2026-04-18'),
((SELECT organization_id FROM organization WHERE name = 'GreenHarvest Growers'),
 'Elementary School Greenhouse Build',
 'Constructed a teaching greenhouse so students can grow produce as part of their science curriculum.',
 'Rexburg, ID', '2026-05-30'),
((SELECT organization_id FROM organization WHERE name = 'GreenHarvest Growers'),
 'Community Seed Library Launch',
 'Established a free seed exchange where residents borrow, grow, and return heirloom vegetable seeds.',
 'Ammon, ID', '2026-07-11'),
((SELECT organization_id FROM organization WHERE name = 'GreenHarvest Growers'),
 'Fall Harvest Food Bank Drive',
 'Coordinated volunteers to glean surplus produce from local farms and deliver it to regional food banks.',
 'Menan, ID', '2026-09-26'),
((SELECT organization_id FROM organization WHERE name = 'GreenHarvest Growers'),
 'Composting Education Workshop',
 'Ran hands-on sessions teaching households to compost kitchen waste and reduce landfill contributions.',
 'Rexburg, ID', '2026-11-07'),

-- UnityServe Volunteers
((SELECT organization_id FROM organization WHERE name = 'UnityServe Volunteers'),
 'Winter Coat Collection Drive',
 'Collected, cleaned, and distributed over four hundred winter coats to families before the first freeze.',
 'Idaho Falls, ID', '2026-01-24'),
((SELECT organization_id FROM organization WHERE name = 'UnityServe Volunteers'),
 'Senior Center Technology Tutoring',
 'Paired volunteers with older adults for weekly one-on-one help with phones, email, and video calls.',
 'Rexburg, ID', '2026-02-21'),
((SELECT organization_id FROM organization WHERE name = 'UnityServe Volunteers'),
 'Riverbank Cleanup Day',
 'Removed litter and invasive vegetation along a two-mile stretch of public riverfront trail.',
 'Salem, ID', '2026-06-06'),
((SELECT organization_id FROM organization WHERE name = 'UnityServe Volunteers'),
 'Holiday Meal Packaging Event',
 'Assembled and delivered complete holiday meal kits to homebound residents across the county.',
 'Rigby, ID', '2026-12-12'),
((SELECT organization_id FROM organization WHERE name = 'UnityServe Volunteers'),
 'Volunteer Leadership Training',
 'Hosted a one-day summit training new volunteer coordinators in scheduling, safety, and recruitment.',
 'Rexburg, ID', '2026-10-17');