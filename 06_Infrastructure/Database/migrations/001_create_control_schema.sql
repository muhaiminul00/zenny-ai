-- ============================================================================
-- 001_create_control_schema.sql
-- Phase A — Zenny Database Structure v3
-- Source: 06_Infrastructure/Database/Database_Structure_v3.md, §1
--
-- Creates the Control schema (ZeroManual Control Plane — manually editable,
-- source of truth, synced down to client schemas). See file 002 for its
-- tables and file 003 for the enum types those tables depend on.
--
-- EXECUTION ORDER NOTE: run 001 -> 003 -> 002 -> 004 -> 005 -> 006 -> 007.
-- File numbering follows the topic order specified in
-- SQL_Phase_A_Instructions.md, not literal execution order — see this
-- migration set's completion report for why 003 (enum types) must run
-- before 002 (control tables), which consumes those types.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS control;
