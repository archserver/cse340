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
