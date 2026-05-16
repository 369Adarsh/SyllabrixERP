-- ============================================================
-- Syllabrix — Row Level Security Policies
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable RLS on all application tables
ALTER TABLE tenants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE services          ENABLE ROW LEVEL SECURITY;
ALTER TABLE students          ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_units       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_tenants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff             ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs   ENABLE ROW LEVEL SECURITY;

-- Deny all direct access via Supabase REST API (anon role)
CREATE POLICY "deny_anon_tenants"           ON tenants           AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_users"             ON users             AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_customers"         ON customers         AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_products"          ON products          AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_categories"        ON categories        AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_tax_rates"         ON tax_rates         AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_stock_movements"   ON stock_movements   AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_transactions"      ON transactions      AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_transaction_items" ON transaction_items AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_invoices"          ON invoices          AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_invoice_items"     ON invoice_items     AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_payments"          ON payments          AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_appointments"      ON appointments      AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_services"          ON services          AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_students"          ON students          AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_fee_records"       ON fee_records       AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_lease_units"       ON lease_units       AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_lease_tenants"     ON lease_tenants     AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_staff"             ON staff             AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_vendors"           ON vendors           AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_purchase_orders"   ON purchase_orders   AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_purchase_items"    ON purchase_items    AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_expenses"          ON expenses          AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_whatsapp_messages" ON whatsapp_messages AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_asset_categories"  ON asset_categories  AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_assets"            ON assets            AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_asset_maintenance" ON asset_maintenance AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_attendance_logs"   ON attendance_logs   AS RESTRICTIVE FOR ALL TO anon USING (false);

-- Deny authenticated role too (Supabase JWT auth is not used by this app)
CREATE POLICY "deny_auth_tenants"           ON tenants           AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_users"             ON users             AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_customers"         ON customers         AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_products"          ON products          AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_categories"        ON categories        AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_tax_rates"         ON tax_rates         AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_stock_movements"   ON stock_movements   AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_transactions"      ON transactions      AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_transaction_items" ON transaction_items AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_invoices"          ON invoices          AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_invoice_items"     ON invoice_items     AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_payments"          ON payments          AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_appointments"      ON appointments      AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_services"          ON services          AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_students"          ON students          AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_fee_records"       ON fee_records       AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_lease_units"       ON lease_units       AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_lease_tenants"     ON lease_tenants     AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_staff"             ON staff             AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_vendors"           ON vendors           AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_purchase_orders"   ON purchase_orders   AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_purchase_items"    ON purchase_items    AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_expenses"          ON expenses          AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_whatsapp_messages" ON whatsapp_messages AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_asset_categories"  ON asset_categories  AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_assets"            ON assets            AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_asset_maintenance" ON asset_maintenance AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_attendance_logs"   ON attendance_logs   AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_customer_subs"     ON customer_subscriptions AS RESTRICTIVE FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_campaigns"         ON whatsapp_campaigns AS RESTRICTIVE FOR ALL TO authenticated USING (false);

-- Enable RLS on new tables
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_anon_customer_subs"  ON customer_subscriptions AS RESTRICTIVE FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_campaigns"      ON whatsapp_campaigns     AS RESTRICTIVE FOR ALL TO anon USING (false);
