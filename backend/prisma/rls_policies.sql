-- ============================================================
-- Syllabrix — Row Level Security Policies (Complete)
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- Run on BOTH Syllabrix-Qty and Syllabrix-Prod
-- Safe to run multiple times (uses DROP IF EXISTS)
-- ============================================================

-- ── 1. Enable RLS on every table ────────────────────────────

ALTER TABLE tenants                ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates              ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices               ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE services               ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE students               ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records            ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_units            ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_tenants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors                ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance      ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_bills           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_bill_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_bill_payments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_note_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices     ENABLE ROW LEVEL SECURITY;

-- ── 2. Drop old policies (safe re-run) ──────────────────────

DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ── 3. Deny anon access to every table ──────────────────────

CREATE POLICY "deny_anon" ON tenants                AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON users                  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON customers              AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON staff                  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON categories             AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON products               AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON tax_rates              AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON stock_movements        AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON transactions           AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON transaction_items      AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON invoices               AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON invoice_items          AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON payments               AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON services               AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON appointments           AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON students               AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON fee_records            AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON lease_units            AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON lease_tenants          AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON vendors                AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON purchase_orders        AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON purchase_items         AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON expenses               AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON whatsapp_messages      AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON asset_categories       AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON assets                 AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON asset_maintenance      AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON attendance_logs        AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON customer_subscriptions AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON whatsapp_campaigns     AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON vendor_bills           AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON vendor_bill_items      AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON vendor_bill_payments   AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON bank_accounts          AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON bank_transactions      AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON credit_notes           AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON credit_note_items      AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON quotations             AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON quotation_items        AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON payroll_runs           AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON payroll_entries        AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon" ON recurring_invoices     AS RESTRICTIVE FOR ALL TO anon USING (false);

-- ── 4. Deny authenticated (Supabase JWT) access ─────────────

CREATE POLICY "deny_auth" ON tenants                AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON users                  AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON customers              AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON staff                  AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON categories             AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON products               AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON tax_rates              AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON stock_movements        AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON transactions           AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON transaction_items      AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON invoices               AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON invoice_items          AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON payments               AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON services               AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON appointments           AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON students               AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON fee_records            AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON lease_units            AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON lease_tenants          AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON vendors                AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON purchase_orders        AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON purchase_items         AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON expenses               AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON whatsapp_messages      AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON asset_categories       AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON assets                 AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON asset_maintenance      AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON attendance_logs        AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON customer_subscriptions AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON whatsapp_campaigns     AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON vendor_bills           AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON vendor_bill_items      AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON vendor_bill_payments   AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON bank_accounts          AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON bank_transactions      AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON credit_notes           AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON credit_note_items      AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON quotations             AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON quotation_items        AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON payroll_runs           AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON payroll_entries        AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth" ON recurring_invoices     AS RESTRICTIVE FOR ALL TO authenticated USING (false);
