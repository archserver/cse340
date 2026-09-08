-- ---------------------------------------------------------------------------
-- categorysetup.sql - creates and seeds the category table and the
-- project_category junction table.
--
-- A service project can fall under several categories, and a category applies to
-- many projects. That is a many-to-many relationship, which a plain column on
-- projects cannot express: one column holds one value, and a comma-separated
-- list would break first normal form and make filtering by category painful.
-- The standard solution is a third table holding one row per pairing.
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
-- It carries no data of its own - only the pair of foreign keys that records
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
    -- file the same project under the same category twice, which a surrogate id
    -- would happily allow.
    PRIMARY KEY (project_id, category_id)
);

-- The first four match the categories already listed on the /categories page;
-- the last three are new. Assigned ids 1 through 7 in order.
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
