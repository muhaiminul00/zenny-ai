-- ============================================================================
-- 005_create_archetype_specific_tables_template.sql
-- Phase A — Zenny Database Structure v3
-- Source: 06_Infrastructure/Database/Database_Structure_v3.md, §5
--
-- All 6 archetype-specific extension tables, written SCHEMA-AGNOSTICALLY —
-- no schema prefix anywhere in this file, same approach as file 004.
--
-- DEPENDENCY: every table below has a FK to conversions(conversion_id).
-- This file MUST be applied AFTER file 004 has already run in the same
-- schema (file 004 creates `conversions`) — otherwise the FK will fail to
-- resolve. In Phase B, only the archetype-relevant table(s) below get
-- applied into a given tpl_* schema (e.g. only conversions_ecom and
-- conversions_restaurant go into tpl_commerce), not all 6 into every
-- schema — see Database_Structure_v3.md §1/§2 for the per-template mapping.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- conversions_emergency (tpl_emergency only)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversions_emergency (
    conversion_id                  uuid PRIMARY KEY REFERENCES conversions(conversion_id),
    location                       text NOT NULL,
    dispatch_window                text NOT NULL,
    team_availability_confirmed    boolean NOT NULL
);

-- ----------------------------------------------------------------------------
-- conversions_ecom (tpl_commerce only)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversions_ecom (
    conversion_id       uuid PRIMARY KEY REFERENCES conversions(conversion_id),
    items                json NOT NULL,
    quantity              integer NOT NULL,
    cart_value               numeric(12,2) NOT NULL,
    delivery_details             text,

    CONSTRAINT chk_conversions_ecom_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_conversions_ecom_cart_value_nonneg CHECK (cart_value >= 0)
);

-- ----------------------------------------------------------------------------
-- conversions_restaurant (tpl_commerce only)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversions_restaurant (
    conversion_id       uuid PRIMARY KEY REFERENCES conversions(conversion_id),
    party_size           integer NOT NULL,
    reservation_time         timestamptz NOT NULL,
    table_confirmed              boolean NOT NULL,
    special_request                  text,

    CONSTRAINT chk_conversions_restaurant_party_size_positive CHECK (party_size > 0)
);

-- ----------------------------------------------------------------------------
-- conversions_appointment (tpl_appointment only)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversions_appointment (
    conversion_id     uuid PRIMARY KEY REFERENCES conversions(conversion_id),
    service_type       text NOT NULL,
    practitioner            text,
    appointment_time            timestamptz NOT NULL,
    special_request                  text
);

-- ----------------------------------------------------------------------------
-- conversions_consultation (tpl_consultation only)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversions_consultation (
    conversion_id    uuid PRIMARY KEY REFERENCES conversions(conversion_id),
    score              integer NOT NULL,
    score_tier             score_tier_enum NOT NULL,

    CONSTRAINT chk_conversions_consultation_score_nonneg CHECK (score >= 0)
);

-- ----------------------------------------------------------------------------
-- conversions_engagement (tpl_engagement only)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversions_engagement (
    conversion_id       uuid PRIMARY KEY REFERENCES conversions(conversion_id),
    contribution_type    contribution_type_enum NOT NULL,
    program_reference        text,
    tribute_name                  text
);
