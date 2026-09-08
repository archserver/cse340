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

-- ---------------------------------------------------------------------------
-- orgsetup.sql - creates and seeds the organization table.
--
-- Run this BEFORE projectsetup.sql: the projects table declares a foreign key
-- against organization, and its seed data looks organizations up by name.
--
-- Re-running this script drops the table. Because projects references it with
-- ON DELETE CASCADE, dropping organization also destroys every seeded project,
-- so projectsetup.sql must be re-run afterward.
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS organization;

CREATE TABLE organization (
    -- SERIAL is PostgreSQL shorthand for an auto-incrementing integer backed by
    -- a sequence. PRIMARY KEY already implies both NOT NULL and UNIQUE.
    organization_id  SERIAL        PRIMARY KEY,

    -- Columns are not prefixed with the table name; the table already provides
    -- that context (organization.name rather than organization.organization_name).
    name             VARCHAR(150)  NOT NULL,

    -- TEXT rather than VARCHAR(n): descriptions have no meaningful length limit.
    description      TEXT          NOT NULL,

    contact_email    VARCHAR(255)  NOT NULL,

    -- Stores only the file name, e.g. 'brightfuture-logo.png'. The /images/ path
    -- prefix is added by the view, and the files live in public/images/.
    logo_filename    VARCHAR(255)  NOT NULL
);

-- organization_id is omitted so SERIAL assigns 1, 2, 3. Supplying ids explicitly
-- would leave the underlying sequence behind, causing duplicate-key errors later.
INSERT INTO organization (name, description, contact_email, logo_filename)
VALUES
(
    'BrightFuture Builders',
    'A nonprofit focused on improving community infrastructure through sustainable construction projects.',
    'info@brightfuturebuilders.org',
    'brightfuture-logo.png'
),
(
    'GreenHarvest Growers',
    'An urban farming collective promoting food sustainability and education in local neighborhoods.',
    'contact@greenharvest.org',
    'greenharvest-logo.png'
),
(
    'UnityServe Volunteers',
    'A volunteer coordination group supporting local charities and service initiatives.',
    'hello@unityserve.org',
    'unityserve-logo.png'
);



-- ---------------------------------------------------------------------------
-- categorysetup.sql - creates and seeds the category table and the
-- project_category junction table.
--
-- A service project can fall under several categories, and a category applies to
-- many projects. That is a many-to-many relationship. A comma-separated
-- list would break first normal form and make filtering by category painful.
-- The solution is a third table one row per pairing.
--
-- Run AFTER orgsetup.sql and projectsetup.sql: project_category declares a
-- foreign key against projects, and its seed rows reference project ids that
-- only exist once projectsetup.sql has run.
-- ---------------------------------------------------------------------------

-- Drop the junction table first. A table cannot be dropped while another table
-- still references it, so the dependent table always goes first.
DROP TABLE IF EXISTS project_category;
DROP TABLE IF EXISTS category;

-- A category carries only an identifier, a name, and a description. 
-- the relationship lives entirely in project_category.
CREATE TABLE category (
    category_id  SERIAL        PRIMARY KEY,

    -- UNIQUE because two categories sharing a name would be pointless.
    name         VARCHAR(100)  NOT NULL UNIQUE,

    description  TEXT          NOT NULL
);

-- ---------------------------------------------------------------------------
-- The junction table.
--
-- It carries only the pair of foreign keys that records
-- "this project belongs to this category". 
-- Bridgeing Table.
-- ---------------------------------------------------------------------------
CREATE TABLE project_category (
    project_id   INT  NOT NULL
                      REFERENCES projects (project_id)
                      ON DELETE CASCADE,

    category_id  INT  NOT NULL
                      REFERENCES category (category_id)
                      ON DELETE CASCADE,

    -- A composite primary key over both columns, rather than a SERIAL surrogate
    -- key. It is the pairing that must be unique: this makes it impossible to
    -- file the same project under the same category twice.
    PRIMARY KEY (project_id, category_id)
);

-- The first four match the categories already listed on the /categories page;
-- the last three are new. Assigned ids 1 through 7 by load order.
INSERT INTO category (name, description)
VALUES
('Environmental',                                                       -- 1
 'Cleanups, conservation, and sustainability projects.'),
('Educational',                                                         -- 2
 'Tutoring, literacy programs, and school support.'),
('Community Service',                                                   -- 3
 'Neighborhood improvement and local outreach.'),
('Health and Wellness',                                                 -- 4
 'Health fairs, food drives, and wellness education.'),
('Food Security',                                                       -- 5
 'Growing, gleaning, and distributing food to households that need it.'),
('Housing and Infrastructure',                                          -- 6
 'Building, repairing, and improving the accessibility of shared spaces and homes.'),
('Senior Support',                                                      -- 7
 'Services, companionship, and practical help for older adults.');

-- ---------------------------------------------------------------------------
-- Seed the pairings.
--
-- The ids below are safe to write literally because both setup scripts DROP and
-- recreate their tables, so SERIAL always restarts at 1 and assigns ids in the
-- order the rows are inserted. Projects are 1-15 in the order they appear in
-- projectsetup.sql; categories are 1-7 in the order above.
--
--   Categories: 1 Environmental          2 Educational
--               3 Community Service      4 Health and Wellness
--               5 Food Security          6 Housing and Infrastructure
--               7 Senior Support
-- ---------------------------------------------------------------------------
INSERT INTO project_category (project_id, category_id)
VALUES
-- BrightFuture Builders
(1, 3), (1, 6),                  -- Riverside Community Center Rebuild
(2, 3), (2, 6), (2, 7),          -- Accessible Ramp Installation
(3, 1), (3, 6),                  -- Solar Panel Barn Raising
(4, 3), (4, 4), (4, 6),          -- Neighborhood Playground Restoration
(5, 1), (5, 2), (5, 6),          -- Reclaimed Lumber Workshop

-- GreenHarvest Growers
(6, 1), (6, 3), (6, 5),          -- Downtown Rooftop Garden
(7, 1), (7, 2), (7, 5),          -- Elementary School Greenhouse Build
(8, 1), (8, 2), (8, 5),          -- Community Seed Library Launch
(9, 3), (9, 4), (9, 5),          -- Fall Harvest Food Bank Drive
(10, 1), (10, 2),                -- Composting Education Workshop

-- UnityServe Volunteers
(11, 3), (11, 4),                -- Winter Coat Collection Drive
(12, 2), (12, 3), (12, 7),       -- Senior Center Technology Tutoring
(13, 1), (13, 3),                -- Riverbank Cleanup Day
(14, 3), (14, 4), (14, 5), (14, 7),  -- Holiday Meal Packaging Event
(15, 2), (15, 3);                -- Volunteer Leadership Training

-- ---------------------------------------------------------------------------
-- Verification: every project with its categories gathered into a column
-- ---------------------------------------------------------------------------
SELECT p.project_id,
       p.title,
       STRING_AGG(c.name, ', ' ORDER BY c.name) AS categories
FROM projects AS p
JOIN project_category AS pc ON pc.project_id = p.project_id
JOIN category AS c          ON c.category_id = pc.category_id
GROUP BY p.project_id, p.title
ORDER BY p.project_id;
