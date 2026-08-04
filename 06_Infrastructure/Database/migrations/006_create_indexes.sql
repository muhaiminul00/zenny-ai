-- ============================================================================
-- 006_create_indexes.sql
-- Phase A — Zenny Database Structure v3
-- Source: 06_Infrastructure/Database/Database_Structure_v3.md, §6/§7
--
-- Indexes for the common (file 004) + archetype-specific (file 005) tables
-- only, written SCHEMA-AGNOSTICALLY — no schema prefix anywhere in this
-- file, same approach as files 004/005.
--
-- SCOPE NOTE: this file only covers the tables created by 004/005, per the
-- instructions ("written schema-agnostically like files 004/005"). It does
-- NOT add indexes for control.* tables' FK columns (client_active_modules
-- .client_id, templates.client_id, sync_log.client_id) — the instructions
-- did not request a control-specific indexing pass in this file (unlike
-- file 007, which explicitly has both a control-specific and a
-- schema-agnostic section). Flagged in the completion report as something
-- worth a follow-up decision, not added here to avoid inventing scope.
--
-- Primary keys (including single-column and the two literal composite PKs
-- in recovery_cadence_profiles / the archetype-specific tables' shared
-- conversion_id PK) already get an automatic unique index from Postgres —
-- not recreated here. Only non-PK FK columns, plus the 4 columns the
-- instructions explicitly name, get an explicit index below.
-- ============================================================================

-- Foreign-key columns (non-PK)
CREATE INDEX IF NOT EXISTS idx_channel_identity_links_customer_id ON channel_identity_links(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer_id ON customer_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_active_issues_customer_id ON active_issues(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_lead_id ON complaints(lead_id);
CREATE INDEX IF NOT EXISTS idx_complaints_customer_id ON complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversions_lead_id ON conversions(lead_id);
CREATE INDEX IF NOT EXISTS idx_recovery_queue_lead_id ON recovery_queue(lead_id);
CREATE INDEX IF NOT EXISTS idx_recovery_queue_conversion_id ON recovery_queue(conversion_id);
CREATE INDEX IF NOT EXISTS idx_suppression_records_lead_id ON suppression_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_emails_customer_id ON emails(customer_id);
CREATE INDEX IF NOT EXISTS idx_emails_lead_id ON emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_emails_category_id ON emails(category_id);
CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_draft_edit_log_email_id ON draft_edit_log(email_id);
CREATE INDEX IF NOT EXISTS idx_escalations_lead_id ON escalations(lead_id);
CREATE INDEX IF NOT EXISTS idx_escalations_customer_id ON escalations(customer_id);

-- Explicitly named in the source-document indexing requirements (§6/§7)
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_date ON leads(created_date);
CREATE INDEX IF NOT EXISTS idx_recovery_queue_next_follow_up ON recovery_queue(next_follow_up);
CREATE INDEX IF NOT EXISTS idx_emails_thread_lifecycle ON emails(thread_lifecycle);
CREATE INDEX IF NOT EXISTS idx_customers_primary_contact_method ON customers(primary_contact_method);
