--
-- PostgreSQL database dump
--

\restrict eOJa0RfQ3fAlwrE9iNbw490nlnskT5k8zyIRKfN8xUkd3RhiRcb9RnPMGBXbcxw

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.16 (Debian 16.16-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: kj_apply_tenancy(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_apply_tenancy() RETURNS void
    LANGUAGE plpgsql
    AS $_$
DECLARE
  t RECORD;
  skip TEXT[] := ARRAY['tenants','platform_users','permissions','kj_migrations','error_logs'];
  def UUID := (SELECT id FROM tenants WHERE is_default LIMIT 1);
BEGIN
  FOR t IN SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname <> ALL (skip)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name=t.name AND column_name='tenant_id') THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN tenant_id UUID', t.name);
      EXECUTE format('UPDATE %I SET tenant_id = $1 WHERE tenant_id IS NULL', t.name) USING def;
      EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET DEFAULT kj_current_tenant()', t.name);
      EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET NOT NULL', t.name);
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (tenant_id)', 'ix_' || t.name || '_tenant', t.name);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t.name AND policyname='kj_tenant_isolation') THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t.name);
      EXECUTE format('CREATE POLICY kj_tenant_isolation ON %I USING (tenant_id = kj_current_tenant()) WITH CHECK (tenant_id = kj_current_tenant())', t.name);
    END IF;
  END LOOP;
END $_$;


--
-- Name: kj_audit_immutable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_audit_immutable() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE EXCEPTION 'LOCKED: audit log entries cannot be changed or deleted' USING ERRCODE = 'P0001';
END $$;


--
-- Name: kj_cancel_relabel(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_cancel_relabel() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  ref TEXT;
  tid BIGINT;
BEGIN
  IF NEW.inventory_id IS NULL THEN RETURN NEW; END IF;
  SELECT COALESCE(c.reference_no, c.cancellation_no) INTO ref FROM cancellations c WHERE c.id = NEW.cancellation_id;
  SELECT t.id INTO tid FROM inventory_transactions t
   WHERE t.item_id = NEW.inventory_id AND t.txn_at = now() AND t.txn_type = 'in' AND t.reference_no IS NULL AND t.qty_change > 0
   ORDER BY t.id DESC LIMIT 1;
  IF tid IS NOT NULL THEN
    UPDATE inventory_transactions SET txn_type = 'cancel', reference_no = ref WHERE id = tid;
  END IF;
  RETURN NEW;
END $$;


--
-- Name: kj_credit_payment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_credit_payment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE bal NUMERIC;
BEGIN
  IF NEW.payment_mode <> 'customer_credit' OR COALESCE(NEW.is_refund, FALSE) THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.customer_id IS NULL THEN RAISE EXCEPTION 'Customer credit needs a customer' USING ERRCODE = 'P0001'; END IF;
    PERFORM 1 FROM customers WHERE id = NEW.customer_id FOR UPDATE;
    SELECT COALESCE(SUM(amount), 0) INTO bal FROM customer_credits WHERE customer_id = NEW.customer_id AND NOT voided;
    IF bal < NEW.amount THEN
      RAISE EXCEPTION 'Customer credit available is %, which is less than %', bal, NEW.amount USING ERRCODE = 'P0001';
    END IF;
    INSERT INTO customer_credits (tenant_id, customer_id, amount, source, payment_id, order_id, ref_no, notes, created_by)
    VALUES (NEW.tenant_id, NEW.customer_id, -NEW.amount, 'credit_used', NEW.id, NEW.order_id, NEW.payment_no, 'Used as payment', NEW.created_by);
  ELSIF TG_OP = 'UPDATE' AND COALESCE(NEW.voided, FALSE) AND NOT COALESCE(OLD.voided, FALSE) THEN
    INSERT INTO customer_credits (tenant_id, customer_id, amount, source, payment_id, order_id, ref_no, notes, created_by)
    VALUES (NEW.tenant_id, NEW.customer_id, NEW.amount, 'credit_reversed', NEW.id, NEW.order_id, NEW.payment_no, 'Receipt voided — credit given back', NEW.voided_by)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;


--
-- Name: kj_current_tenant(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_current_tenant() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::uuid,
                  (SELECT id FROM tenants WHERE is_default LIMIT 1))
$$;


--
-- Name: kj_customer_state(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_customer_state() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  shop_state TEXT;
BEGIN
  IF TG_OP = 'INSERT' AND COALESCE(trim(NEW.state), '') = '' AND NEW.state_code IS NULL THEN
    SELECT s.state INTO shop_state FROM shop_settings s WHERE s.tenant_id = NEW.tenant_id
     ORDER BY (s.singleton_key = 'main') DESC NULLS LAST, s.id LIMIT 1;
    IF COALESCE(trim(shop_state), '') <> '' THEN NEW.state := COALESCE(kj_state_name(kj_state_code(shop_state)), shop_state); END IF;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.state IS DISTINCT FROM OLD.state AND NEW.state_code IS NOT DISTINCT FROM OLD.state_code THEN
    NEW.state_code := NULL;
  END IF;
  IF NEW.state_code IS NULL THEN
    NEW.state_code := COALESCE(kj_state_code(NEW.state),
      CASE WHEN COALESCE(NEW.gst_no, '') ~ '^\d{2}' THEN (SELECT l.code FROM kj_state_list() l WHERE l.code = substr(NEW.gst_no, 1, 2)) END);
  END IF;
  IF COALESCE(trim(NEW.state), '') = '' AND NEW.state_code IS NOT NULL THEN NEW.state := kj_state_name(NEW.state_code); END IF;
  RETURN NEW;
END $$;


--
-- Name: kj_dedupe_doc_no(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_dedupe_doc_no() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
  col    TEXT := TG_ARGV[0];
  val    TEXT;
  pfx    TEXT;
  width  INT;
  seed   BIGINT;
  nxt    BIGINT;
  taken  BOOLEAN;
BEGIN
  val := to_jsonb(NEW) ->> col;
  IF val IS NULL OR val !~ '\d+$' THEN RETURN NEW; END IF;
  pfx   := substring(val from '^(.*?)\d+$');
  width := length(substring(val from '(\d+)$'));
  -- one save at a time per series (released at commit / rollback)
  PERFORM pg_advisory_xact_lock(hashtext('kj_doc_no:' || TG_TABLE_NAME || ':' || COALESCE(pfx, '')));
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE %I = $1)', TG_TABLE_NAME, col) INTO taken USING val;
  IF NOT taken THEN RETURN NEW; END IF;
  EXECUTE format('SELECT COALESCE(MAX(NULLIF(substring(%1$I from %2$L), '''')::bigint), 0) FROM %3$I WHERE %1$I LIKE %4$L',
                 col, '^' || regexp_replace(pfx, '([.^$*+?()\[\]{}|\\/-])', '\\\1', 'g') || '(\d+)$',
                 TG_TABLE_NAME, replace(replace(pfx, '%', '\%'), '_', '\_') || '%')
    INTO seed;
  nxt := kj_next_counter(COALESCE((to_jsonb(NEW) ->> 'tenant_id')::uuid, kj_current_tenant()),
                         TG_TABLE_NAME || ':' || pfx, '', seed);
  NEW := jsonb_populate_record(NEW, jsonb_build_object(col, pfx || lpad(nxt::text, width, '0')));
  RETURN NEW;
END $_$;


--
-- Name: kj_emit_event(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_emit_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  t   TEXT;
  p   JSONB;
  tbl TEXT := TG_TABLE_NAME;
BEGIN
  IF tbl = 'payments' THEN
    IF TG_OP = 'INSERT' AND NOT COALESCE(NEW.is_refund, FALSE) THEN t := 'payment.received';
    ELSIF TG_OP = 'UPDATE' AND COALESCE(NEW.voided, FALSE) AND NOT COALESCE(OLD.voided, FALSE) THEN t := 'payment.voided';
    END IF;
    p := jsonb_build_object('id', NEW.id, 'paymentNo', NEW.payment_no, 'amount', NEW.amount::text, 'mode', NEW.payment_mode,
           'paymentFor', NEW.payment_for, 'orderId', NEW.order_id, 'customerId', NEW.customer_id, 'reference', NEW.reference_no,
           'externalRef', NEW.external_ref);
  ELSIF tbl = 'orders' THEN
    IF NEW.order_type IS DISTINCT FROM 'sale' THEN RETURN NEW; END IF;
    IF TG_OP = 'INSERT' THEN t := 'sales_order.created';
    ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'cancelled' THEN t := 'sales_order.cancelled';
    ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('delivered', 'completed') THEN t := 'sales_order.delivered';
    ELSIF NEW.status IS DISTINCT FROM OLD.status OR NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN t := 'sales_order.updated';
    END IF;
    p := jsonb_build_object('id', NEW.id, 'orderNo', NEW.order_no, 'status', NEW.status, 'total', NEW.total_amount::text,
           'paid', NEW.paid_amount::text, 'balance', NEW.pending_amount::text, 'customerId', NEW.customer_id, 'externalRef', NEW.external_ref);
  ELSIF tbl = 'customers' THEN
    t := CASE WHEN TG_OP = 'INSERT' THEN 'customer.created' ELSE 'customer.updated' END;
    IF TG_OP = 'UPDATE' AND (to_jsonb(NEW) - 'updated_at' - 'total_purchased' - 'last_visit_date') = (to_jsonb(OLD) - 'updated_at' - 'total_purchased' - 'last_visit_date') THEN RETURN NEW; END IF;
    p := jsonb_build_object('id', NEW.id, 'code', NEW.customer_code, 'name', NEW.name, 'phone', NEW.phone, 'externalRef', NEW.external_ref);
  ELSIF tbl = 'inventory' THEN
    IF TG_OP = 'INSERT' THEN t := 'inventory.item.created';
    ELSIF NEW.quantity < OLD.quantity AND COALESCE(current_setting('app.ledger_type', true), '') IN ('', 'sale', 'out') THEN t := 'inventory.item.sold';
    ELSE t := 'inventory.item.updated';
    END IF;
    p := jsonb_build_object('id', NEW.id, 'code', NEW.item_code, 'name', NEW.name, 'quantity', NEW.quantity, 'externalRef', NEW.external_ref);
  ELSIF tbl = 'repairs' THEN
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('ready', 'delivered') THEN t := 'repair.' || NEW.status; END IF;
    p := jsonb_build_object('id', NEW.id, 'repairNo', NEW.repair_no, 'status', NEW.status, 'customerId', NEW.customer_id);
  ELSIF tbl = 'daily_rates' THEN
    t := 'rates.updated';
    p := jsonb_build_object('date', NEW.rate_date, 'gold_24k', NEW.gold_24k, 'gold_22k', NEW.gold_22k, 'gold_18k', NEW.gold_18k,
           'silver', NEW.silver, 'platinum', NEW.platinum);
  END IF;
  IF t IS NOT NULL THEN
    INSERT INTO domain_events (tenant_id, event_type, payload) VALUES (NEW.tenant_id, t, p);
  END IF;
  RETURN NEW;
END $$;


--
-- Name: kj_fineness(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_fineness(p text) RETURNS numeric
    LANGUAGE plpgsql IMMUTABLE
    AS $_$
DECLARE
  s TEXT := upper(trim(COALESCE(p, '')));
  k NUMERIC;
BEGIN
  IF s = '' THEN RETURN NULL; END IF;
  IF s = 'KDM' THEN RETURN 0.916; END IF;
  IF s ~ '^\d{2}(\.\d+)?\s*%?$' THEN
    k := rtrim(rtrim(s, '%'))::numeric;
    IF k > 24 THEN RETURN k / 100; END IF;                                  -- 91.6 → 0.916
    s := k::text || 'K';                                                    -- "22" on its own = 22K
  END IF;
  IF s ~ '^\d{1,2}(\.\d+)?\s*K(T|ARAT)?$' THEN
    k := substring(s from '^(\d{1,2}(?:\.\d+)?)')::numeric;
    RETURN CASE k WHEN 24 THEN 0.999 WHEN 23 THEN 0.958 WHEN 22 THEN 0.916 WHEN 21 THEN 0.875 WHEN 20 THEN 0.833
                  WHEN 18 THEN 0.750 WHEN 16 THEN 0.666 WHEN 14 THEN 0.585 WHEN 10 THEN 0.417 WHEN 9 THEN 0.375
                  ELSE round(k / 24, 3) END;
  END IF;
  IF s ~ '^\d{3}$' THEN RETURN s::numeric / 1000; END IF;
  IF s ~ '^\d{4}$' THEN RETURN s::numeric / 10000; END IF;
  IF s ~ '^0?\.\d+$' THEN RETURN s::numeric; END IF;
  RETURN NULL;
END $_$;


--
-- Name: kj_fy_order_no(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_fy_order_no() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
  cfg   JSONB;
  fy_m  INT;
  d     DATE := COALESCE(NEW.created_at, NOW())::date;
  y     INT;
  label TEXT;
  pfx   TEXT;
  width INT;
  seed  BIGINT;
  n     BIGINT;
BEGIN
  IF NEW.order_type IS DISTINCT FROM 'sale' THEN RETURN NEW; END IF;
  SELECT data INTO cfg FROM shop_settings_v2 WHERE tenant_id = NEW.tenant_id AND grp = 'invoice';
  IF cfg IS NULL OR COALESCE(cfg->>'numbering', 'legacy') <> 'fy' THEN RETURN NEW; END IF;
  fy_m  := COALESCE((cfg->>'fyStartMonth')::int, 4);
  y     := CASE WHEN EXTRACT(MONTH FROM d) >= fy_m THEN EXTRACT(YEAR FROM d)::int ELSE EXTRACT(YEAR FROM d)::int - 1 END;
  label := lpad((y % 100)::text, 2, '0') || '-' || lpad(((y + 1) % 100)::text, 2, '0');
  pfx   := COALESCE(NULLIF(cfg->>'salesPrefix', ''), 'SO') || '/' || label || '/';
  width := COALESCE((cfg->>'numberWidth')::int, 4);
  SELECT COALESCE(MAX(NULLIF(substring(order_no from length(pfx) + 1), '')::bigint), 0) INTO seed
    FROM orders WHERE tenant_id = NEW.tenant_id AND order_no LIKE replace(pfx, '_', '\_') || '%'
     AND substring(order_no from length(pfx) + 1) ~ '^\d+$';
  n := kj_next_counter(NEW.tenant_id, 'orders:' || pfx, '', seed);
  NEW.order_no := pfx || lpad(n::text, width, '0');
  RETURN NEW;
END $_$;


--
-- Name: kj_inventory_ledger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_inventory_ledger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  diff INTEGER;
  typ  TEXT;
  ref  TEXT := NULLIF(current_setting('app.ledger_ref', true), '');
BEGIN
  IF COALESCE(current_setting('app.ledger_skip', true), '') = '1' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    diff := COALESCE(NEW.quantity, 0);
    IF diff = 0 THEN RETURN NEW; END IF;
    typ := 'stock_in';
  ELSE
    diff := COALESCE(NEW.quantity, 0) - COALESCE(OLD.quantity, 0);
    IF diff = 0 THEN RETURN NEW; END IF;
    typ := NULLIF(current_setting('app.ledger_type', true), '');
    IF typ IS NULL THEN
      IF diff < 0 THEN
        SELECT o.order_no INTO ref FROM order_items oi JOIN orders o ON o.id = oi.order_id
         WHERE oi.inventory_id = NEW.id AND o.created_at = now() ORDER BY o.id DESC LIMIT 1;
        typ := CASE WHEN ref IS NOT NULL THEN 'sale' ELSE 'out' END;
      ELSE
        SELECT o.order_no INTO ref FROM order_items oi JOIN orders o ON o.id = oi.order_id
         WHERE oi.inventory_id = NEW.id AND o.updated_at = now() AND o.status IN ('cancelled', 'returned') ORDER BY o.id DESC LIMIT 1;
        IF ref IS NULL THEN
          SELECT COALESCE(c.reference_no, c.cancellation_no) INTO ref FROM cancellation_items ci JOIN cancellations c ON c.id = ci.cancellation_id
           WHERE ci.inventory_id = NEW.id AND c.created_at = now() ORDER BY c.id DESC LIMIT 1;
        END IF;
        IF ref IS NULL THEN
          SELECT o.order_no INTO ref FROM order_items oi JOIN orders o ON o.id = oi.order_id
           WHERE oi.inventory_id = NEW.id AND o.updated_at = now() ORDER BY o.id DESC LIMIT 1;
          typ := CASE WHEN ref IS NOT NULL THEN 'return' ELSE 'in' END;
        ELSE
          typ := 'cancel';
        END IF;
      END IF;
    END IF;
  END IF;
  INSERT INTO inventory_transactions (tenant_id, item_id, txn_type, reference_no, qty_change, balance_after, created_by)
  VALUES (NEW.tenant_id, NEW.id, typ, ref, diff, COALESCE(NEW.quantity, 0), NULLIF(current_setting('app.actor_id', true), '')::int);
  RETURN NEW;
END $$;


--
-- Name: kj_inventory_prices(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_inventory_prices() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.created_by IS NULL THEN
    NEW.created_by := NULLIF(current_setting('app.actor_id', true), '')::int;
  END IF;
  IF COALESCE(NEW.cost_price, 0) > 0 AND NEW.retail_margin_pct IS NOT NULL
    THEN NEW.retail_price := ROUND(NEW.cost_price * (1 + NEW.retail_margin_pct / 100), 2);
    ELSE NEW.retail_price := NULL; END IF;
  IF COALESCE(NEW.cost_price, 0) > 0 AND NEW.wholesale_margin_pct IS NOT NULL
    THEN NEW.wholesale_price := ROUND(NEW.cost_price * (1 + NEW.wholesale_margin_pct / 100), 2);
    ELSE NEW.wholesale_price := NULL; END IF;
  RETURN NEW;
END $$;


--
-- Name: kj_next_counter(uuid, text, text, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_next_counter(p_tenant uuid, p_series text, p_period text, p_seed bigint) RETURNS bigint
    LANGUAGE sql
    AS $$
  INSERT INTO doc_counters (tenant_id, series, period, last_no)
  VALUES (p_tenant, p_series, COALESCE(p_period, ''), COALESCE(p_seed, 0) + 1)
  ON CONFLICT (tenant_id, series, period) DO UPDATE
     SET last_no = GREATEST(doc_counters.last_no, COALESCE(p_seed, 0)) + 1, updated_at = NOW()
  RETURNING last_no
$$;


--
-- Name: kj_norm_metal(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_norm_metal(m text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT CASE
    WHEN m IS NULL OR btrim(m) = '' THEN NULL
    WHEN lower(m) LIKE '%gold%' THEN 'gold'
    WHEN lower(m) LIKE '%silver%' THEN 'silver'
    WHEN lower(m) LIKE '%platinum%' THEN 'platinum'
    WHEN lower(m) LIKE '%diamond%' THEN 'diamond'
    ELSE 'other' END
$$;


--
-- Name: kj_norm_purity(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_norm_purity(metal text, p text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $_$
DECLARE x TEXT; f TEXT;
BEGIN
  IF p IS NULL OR btrim(p) = '' THEN RETURN p; END IF;
  x := upper(regexp_replace(p, '\s+', '', 'g'));
  x := regexp_replace(x, '(SILVER|GOLD|PLATINUM)', '', 'g');
  x := regexp_replace(x, '(KT|CT|CARAT|KARAT)$', 'K');
  IF x = 'OTHER' THEN RETURN 'other'; END IF;
  IF metal IN ('gold', 'diamond') THEN
    IF x ~ '^\d{1,2}K' THEN RETURN substring(x from '^(\d{1,2})K') || 'K'; END IF;
    f := substring(x from '^(\d{3})');
    RETURN COALESCE(CASE f WHEN '999' THEN '24K' WHEN '995' THEN '24K' WHEN '958' THEN '23K' WHEN '916' THEN '22K' WHEN '875' THEN '21K'
      WHEN '833' THEN '20K' WHEN '750' THEN '18K' WHEN '667' THEN '16K' WHEN '585' THEN '14K' WHEN '417' THEN '10K' WHEN '375' THEN '9K' END, p);
  END IF;
  IF metal IN ('silver', 'platinum') THEN
    IF x = '92.5' THEN RETURN '925'; END IF;
    IF x ~ '^\d{3}' THEN RETURN substring(x from '^(\d{3})'); END IF;
  END IF;
  RETURN p;
END $_$;


--
-- Name: kj_old_gold_cancel_metal(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_old_gold_cancel_metal() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    IF EXISTS (SELECT 1 FROM metal_stock_movements m JOIN old_gold_items i ON m.posting_ref = 'ogi:' || i.id
                WHERE i.purchase_id = NEW.id AND m.status <> 'pending_test') THEN
      RAISE EXCEPTION 'This voucher cannot be cancelled: some of its metal is already tested or at the refiner.' USING ERRCODE = 'P0001';
    END IF;
    DELETE FROM metal_stock_movements m USING old_gold_items i WHERE m.posting_ref = 'ogi:' || i.id AND i.purchase_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;


--
-- Name: kj_old_gold_to_metal_stock(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_old_gold_to_metal_stock() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  pur RECORD;
  mv  RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT purchase_no, customer_name, purchase_date, tenant_id INTO pur FROM old_gold_purchases WHERE id = NEW.purchase_id;
    INSERT INTO metal_stock_movements (tenant_id, movement_date, metal, purity, tested_purity, description, gross_weight, net_weight,
                                       fine_weight, value, movement_type, source_type, source_id, source_no, posting_ref, notes)
    VALUES (COALESCE(NEW.tenant_id, pur.tenant_id), COALESCE(pur.purchase_date, CURRENT_DATE), COALESCE(NEW.metal_type, 'gold'), NEW.purity,
            NULLIF(NEW.touch_purity, ''), NEW.description, NEW.gross_weight, NEW.net_weight,
            COALESCE(NEW.fine_weight, round(NEW.net_weight * kj_fineness(COALESCE(NULLIF(NEW.touch_purity, ''), NEW.purity)), 3)), NEW.value,
            'old_gold', 'old_gold_item', NEW.id, pur.purchase_no, 'ogi:' || NEW.id, 'From ' || COALESCE(pur.customer_name, 'customer'))
    ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;
  SELECT * INTO mv FROM metal_stock_movements WHERE posting_ref = 'ogi:' || OLD.id;
  IF FOUND AND mv.status <> 'pending_test' THEN
    RAISE EXCEPTION 'This old gold item is locked: the metal is already % (%). Undo that in Old Metal Stock first.',
      replace(mv.status, '_', ' '), COALESCE(mv.source_no, '') USING ERRCODE = 'P0001';
  END IF;
  IF TG_OP = 'DELETE' THEN
    DELETE FROM metal_stock_history WHERE movement_id = mv.id;
    DELETE FROM metal_stock_movements WHERE posting_ref = 'ogi:' || OLD.id AND status = 'pending_test';
    RETURN OLD;
  END IF;
  UPDATE metal_stock_movements SET metal = COALESCE(NEW.metal_type, 'gold'), purity = NEW.purity, tested_purity = NULLIF(NEW.touch_purity, ''),
         description = NEW.description, gross_weight = NEW.gross_weight, net_weight = NEW.net_weight, value = NEW.value,
         fine_weight = COALESCE(NEW.fine_weight, round(NEW.net_weight * kj_fineness(COALESCE(NULLIF(NEW.touch_purity, ''), NEW.purity)), 3)), updated_at = NOW()
   WHERE posting_ref = 'ogi:' || NEW.id;
  RETURN NEW;
END $$;


--
-- Name: kj_order_item_snapshot(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_order_item_snapshot() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  it RECORD;
BEGIN
  IF NEW.inventory_id IS NOT NULL THEN
    SELECT stone_weight, metal_type, sub_category, wastage_pct, cost_price, retail_price, wholesale_price INTO it FROM inventory WHERE id = NEW.inventory_id;
    IF NEW.stones IS NULL THEN NEW.stones := kj_stones_json(NEW.inventory_id); END IF;
    IF NEW.stone_weight IS NULL THEN NEW.stone_weight := it.stone_weight; END IF;
    IF NEW.metal_type IS NULL THEN NEW.metal_type := it.metal_type; END IF;
    IF NEW.item_type IS NULL THEN NEW.item_type := it.sub_category; END IF;
    IF NEW.wastage_pct IS NULL THEN NEW.wastage_pct := it.wastage_pct; END IF;
    IF NEW.cost_price IS NULL AND COALESCE(it.cost_price, 0) > 0 THEN NEW.cost_price := it.cost_price; END IF;
    IF NEW.retail_price IS NULL THEN NEW.retail_price := it.retail_price; END IF;
    IF NEW.wholesale_price IS NULL THEN NEW.wholesale_price := it.wholesale_price; END IF;
  END IF;
  RETURN NEW;
END $$;


--
-- Name: kj_protect_owner(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_protect_owner() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  actor TEXT := NULLIF(current_setting('app.actor_id', true), '');
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_owner THEN
      RAISE EXCEPTION 'OWNER_PROTECTED: the shop owner account can never be deleted' USING ERRCODE='P0001';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    RETURN NEW; -- one owner per tenant is guaranteed by users_one_owner
  END IF;

  IF OLD.is_owner THEN
    IF NOT NEW.is_owner AND COALESCE(current_setting('app.owner_transfer', true), '') <> '1' THEN
      RAISE EXCEPTION 'OWNER_PROTECTED: ownership can only be transferred by the owner' USING ERRCODE='P0001';
    END IF;
    IF NEW.is_owner AND NEW.is_active IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION 'OWNER_PROTECTED: the shop owner cannot be disabled' USING ERRCODE='P0001';
    END IF;
    IF NEW.is_owner AND NEW.role IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'OWNER_PROTECTED: the shop owner role cannot be changed' USING ERRCODE='P0001';
    END IF;
    IF (NEW.name IS DISTINCT FROM OLD.name OR NEW.email IS DISTINCT FROM OLD.email
        OR NEW.username IS DISTINCT FROM OLD.username)
       AND actor IS DISTINCT FROM OLD.id::text THEN
      RAISE EXCEPTION 'OWNER_PROTECTED: only the owner can rename the owner account' USING ERRCODE='P0001';
    END IF;
    IF (NEW.password_hash IS DISTINCT FROM OLD.password_hash OR NEW.recovery_hash IS DISTINCT FROM OLD.recovery_hash)
       AND NEW.pw_changed_by IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'OWNER_PROTECTED: only the owner can change the owner password' USING ERRCODE='P0001';
    END IF;
  ELSIF NEW.is_owner AND COALESCE(current_setting('app.owner_transfer', true), '') <> '1' THEN
    RAISE EXCEPTION 'OWNER_PROTECTED: a user cannot be made owner this way' USING ERRCODE='P0001';
  END IF;

  NEW.pw_changed_by := NULL;  -- one-shot marker
  RETURN NEW;
END $$;


--
-- Name: kj_protect_owner_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_protect_owner_role() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM users u JOIN roles r ON r.id = OLD.role_id
             WHERE u.id = OLD.user_id AND u.is_owner AND r.system_key = 'owner')
     AND COALESCE(current_setting('app.owner_transfer', true), '') <> '1' THEN
    RAISE EXCEPTION 'OWNER_PROTECTED: the Owner role cannot be removed from the owner' USING ERRCODE='P0001';
  END IF;
  RETURN OLD;
END $$;


--
-- Name: kj_register_attribute(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_register_attribute() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  sid INTEGER;
  n   INTEGER;
BEGIN
  IF NEW.register_session_id IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.created_by IS NOT NULL THEN
    SELECT s.id INTO sid FROM register_sessions s JOIN register_session_users u ON u.session_id = s.id
     WHERE s.tenant_id = NEW.tenant_id AND s.status <> 'closed' AND u.user_id = NEW.created_by AND u.left_at IS NULL
     ORDER BY s.opened_at DESC LIMIT 1;
  END IF;
  IF sid IS NULL THEN
    SELECT COUNT(*), MIN(id) INTO n, sid FROM register_sessions WHERE tenant_id = NEW.tenant_id AND status <> 'closed';
    IF n <> 1 THEN sid := NULL; END IF;
  END IF;
  NEW.register_session_id := sid;
  RETURN NEW;
END $$;


--
-- Name: kj_register_change_flag(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_register_change_flag() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE st TEXT;
BEGIN
  IF OLD.register_session_id IS NULL THEN RETURN NEW; END IF;
  SELECT status INTO st FROM register_sessions WHERE id = OLD.register_session_id;
  IF st <> 'closed' THEN RETURN NEW; END IF;
  IF NEW.amount IS DISTINCT FROM OLD.amount OR NEW.payment_mode IS DISTINCT FROM OLD.payment_mode OR NEW.voided IS DISTINCT FROM OLD.voided
     OR NEW.register_session_id IS DISTINCT FROM OLD.register_session_id THEN
    INSERT INTO register_change_flags (tenant_id, session_id, source, source_id, change)
    VALUES (OLD.tenant_id, OLD.register_session_id, CASE WHEN TG_TABLE_NAME = 'payments' THEN 'payment' ELSE 'outflow' END, OLD.id,
            format('amount %s→%s, mode %s→%s, voided %s→%s', OLD.amount, NEW.amount, OLD.payment_mode, NEW.payment_mode, OLD.voided, NEW.voided));
    UPDATE register_sessions SET changed_after_close = TRUE WHERE id = OLD.register_session_id AND NOT changed_after_close;
  END IF;
  RETURN NEW;
END $$;


--
-- Name: kj_register_child_lock(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_register_child_lock() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE st TEXT;
BEGIN
  SELECT status INTO st FROM register_sessions WHERE id = COALESCE(NEW.session_id, OLD.session_id);
  IF st = 'closed' AND COALESCE(current_setting('app.register_reopen', true), '') <> '1' THEN
    RAISE EXCEPTION 'This register day is closed. An admin must reopen it first.' USING ERRCODE = 'P0001';
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'register_entries' THEN RAISE EXCEPTION 'Cash entries are voided with a reason, never deleted' USING ERRCODE = 'P0001'; END IF;
    RETURN OLD;
  END IF;
  RETURN NEW;
END $$;


--
-- Name: kj_register_session_lock(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_register_session_lock() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Register sessions are never deleted' USING ERRCODE = 'P0001'; END IF;
  IF OLD.status = 'closed' AND COALESCE(current_setting('app.register_reopen', true), '') <> '1' THEN
    IF (to_jsonb(NEW) - 'changed_after_close') = (to_jsonb(OLD) - 'changed_after_close') THEN RETURN NEW; END IF;
    RAISE EXCEPTION 'This register day is closed. An admin must reopen it first.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;


--
-- Name: kj_shipment_event(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_shipment_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status OR NEW.awb_no IS DISTINCT FROM OLD.awb_no THEN
    INSERT INTO domain_events (tenant_id, event_type, payload) VALUES (NEW.tenant_id,
      CASE WHEN TG_OP = 'INSERT' THEN 'shipment.created' ELSE 'shipment.updated' END,
      jsonb_build_object('id', NEW.id, 'shipmentNo', NEW.shipment_no, 'orderId', NEW.sales_order_id, 'courier', NEW.courier,
        'awb', NEW.awb_no, 'status', NEW.status, 'externalRef', NEW.external_ref));
  END IF;
  RETURN NEW;
END $$;


--
-- Name: kj_state_code(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_state_code(p text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  s TEXT := lower(regexp_replace(trim(COALESCE(p, '')), '\s+', ' ', 'g'));
  c TEXT;
BEGIN
  IF s = '' THEN RETURN NULL; END IF;
  IF s ~ '^\d{2}' THEN
    SELECT l.code INTO c FROM kj_state_list() l WHERE l.code = substr(s, 1, 2);
    IF c IS NOT NULL THEN RETURN c; END IF;
  END IF;
  s := replace(replace(s, ' and ', ' & '), '.', '');
  SELECT l.code INTO c FROM kj_state_list() l WHERE lower(l.name) = s;
  IF c IS NOT NULL THEN RETURN c; END IF;
  RETURN CASE
    WHEN s IN ('j&k','jammu and kashmir','jammu kashmir') THEN '01'
    WHEN s IN ('hp') THEN '02' WHEN s IN ('uttaranchal','uk') THEN '05' WHEN s IN ('new delhi','nct of delhi','delhi ncr') THEN '07'
    WHEN s IN ('up') THEN '09' WHEN s IN ('wb','bengal') THEN '19' WHEN s IN ('orissa') THEN '21' WHEN s IN ('mp') THEN '23'
    WHEN s IN ('daman & diu','daman and diu','dadra & nagar haveli','dadra and nagar haveli','dnh','dd') THEN '26'
    WHEN s IN ('mh','bombay') THEN '27' WHEN s IN ('ka') THEN '29' WHEN s IN ('tn') THEN '33' WHEN s IN ('pondicherry') THEN '34'
    WHEN s IN ('andaman','andaman and nicobar','andaman & nicobar') THEN '35' WHEN s IN ('ts') THEN '36' WHEN s IN ('ap') THEN '37'
    ELSE NULL END;
END $$;


--
-- Name: kj_state_list(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_state_list() RETURNS TABLE(code text, name text)
    LANGUAGE sql IMMUTABLE
    AS $$
  VALUES ('01','Jammu & Kashmir'),('02','Himachal Pradesh'),('03','Punjab'),('04','Chandigarh'),('05','Uttarakhand'),
         ('06','Haryana'),('07','Delhi'),('08','Rajasthan'),('09','Uttar Pradesh'),('10','Bihar'),('11','Sikkim'),
         ('12','Arunachal Pradesh'),('13','Nagaland'),('14','Manipur'),('15','Mizoram'),('16','Tripura'),('17','Meghalaya'),
         ('18','Assam'),('19','West Bengal'),('20','Jharkhand'),('21','Odisha'),('22','Chhattisgarh'),('23','Madhya Pradesh'),
         ('24','Gujarat'),('26','Dadra & Nagar Haveli and Daman & Diu'),('27','Maharashtra'),('29','Karnataka'),('30','Goa'),
         ('31','Lakshadweep'),('32','Kerala'),('33','Tamil Nadu'),('34','Puducherry'),('35','Andaman & Nicobar Islands'),
         ('36','Telangana'),('37','Andhra Pradesh'),('38','Ladakh'),('96','Foreign Country'),('97','Other Territory')
$$;


--
-- Name: kj_state_name(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_state_name(p text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT l.name FROM kj_state_list() l WHERE l.code = p
$$;


--
-- Name: kj_stones_json(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kj_stones_json(p_item integer) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'type', s.stone_type, 'group', s.stone_group, 'name', COALESCE(s.stone_name, s.stone_type), 'shape', s.shape, 'cut', s.cut, 'clarity', s.clarity,
           'colour', s.colour, 'size', s.size, 'setting', s.setting, 'pcs', s.pcs, 'carat', s.carat, 'weightG', s.weight_g,
           'rate', s.rate_per_ct, 'rateType', s.rate_type, 'amount', s.amount, 'origin', s.origin,
           'certificateNo', s.certificate_no, 'lab', s.lab) ORDER BY s.line_no, s.id), '[]'::jsonb)
    FROM inventory_stones s WHERE s.item_id = p_item
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: advance_reversals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.advance_reversals (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant(),
    allocation_id integer,
    order_id integer,
    order_no character varying(40),
    order_item_id integer,
    item_name character varying(200),
    booking_id integer,
    deposit_id integer,
    metal_type character varying(20),
    weight numeric(10,3) DEFAULT 0 NOT NULL,
    rate_per_10g numeric(14,2),
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    payment_no character varying(40),
    applied_at timestamp with time zone,
    reason text NOT NULL,
    source character varying(20) DEFAULT 'reverse'::character varying NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: advance_reversals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.advance_reversals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: advance_reversals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.advance_reversals_id_seq OWNED BY public.advance_reversals.id;


--
-- Name: api_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_clients (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    name character varying(100) NOT NULL,
    client_id character varying(40) NOT NULL,
    secret_hash character varying(255) NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    ip_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    rate_per_min integer DEFAULT 120 NOT NULL,
    status character varying(10) DEFAULT 'active'::character varying NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone,
    revoked_at timestamp with time zone,
    revoked_by integer,
    CONSTRAINT api_clients_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'revoked'::character varying])::text[])))
);


--
-- Name: api_clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.api_clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_clients_id_seq OWNED BY public.api_clients.id;


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    api_client_id integer NOT NULL,
    key_prefix character varying(20) NOT NULL,
    key_hash character(64) NOT NULL,
    expires_at timestamp with time zone,
    revoked_at timestamp with time zone,
    last_used_at timestamp with time zone,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.api_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_keys_id_seq OWNED BY public.api_keys.id;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id bigint NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    at timestamp with time zone DEFAULT now() NOT NULL,
    actor_type character varying(20) DEFAULT 'user'::character varying NOT NULL,
    actor_id character varying(64),
    actor_name character varying(200),
    action character varying(60) NOT NULL,
    entity character varying(60),
    entity_id character varying(64),
    ref_no character varying(64),
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    reason text,
    ip character varying(64),
    user_agent text,
    request_id character varying(64),
    CONSTRAINT audit_log_actor_type_check CHECK (((actor_type)::text = ANY ((ARRAY['user'::character varying, 'api_client'::character varying, 'system'::character varying, 'platform'::character varying])::text[])))
);


--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: booking_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_items (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    description character varying(300),
    category character varying(50),
    metal_type character varying(50),
    purity character varying(20),
    weight numeric(10,3),
    design_note text,
    quantity integer DEFAULT 1,
    estimated_amount numeric(14,2) DEFAULT 0,
    inventory_id integer,
    delivery_date date,
    delivered_qty integer DEFAULT 0,
    cancelled_qty integer DEFAULT 0,
    item_status character varying(20) DEFAULT 'pending'::character varying,
    rate_per_unit numeric(14,2) DEFAULT 0,
    booking_rate numeric(14,2) DEFAULT 0,
    delivery_rate numeric(14,2) DEFAULT 0,
    balance_amount numeric(14,2) DEFAULT 0,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    booking_weight numeric(10,3) DEFAULT 0,
    balance_weight numeric(10,3) DEFAULT 0
);


--
-- Name: booking_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.booking_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: booking_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.booking_items_id_seq OWNED BY public.booking_items.id;


--
-- Name: booking_metal_deposits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_metal_deposits (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    metal_type character varying(20) NOT NULL,
    deposit_date date DEFAULT CURRENT_DATE NOT NULL,
    rate_per_10g numeric(14,2),
    amount numeric(14,2),
    grams_locked numeric(10,3),
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    allocated_weight numeric(10,3) DEFAULT 0,
    remaining_weight numeric(10,3) DEFAULT 0,
    allocation_status character varying(20) DEFAULT 'open'::character varying,
    gst_pct numeric(6,3) DEFAULT 0 NOT NULL,
    gst_amount numeric(14,2) DEFAULT 0 NOT NULL,
    refunded_weight numeric(10,3) DEFAULT 0 NOT NULL,
    refunded_amount numeric(14,2) DEFAULT 0 NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL
);


--
-- Name: booking_metal_deposits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.booking_metal_deposits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: booking_metal_deposits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.booking_metal_deposits_id_seq OWNED BY public.booking_metal_deposits.id;


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    booking_no character varying(30),
    customer_id integer,
    customer_name character varying(200),
    phone character varying(20),
    occasion character varying(100),
    total_estimate numeric(14,2) DEFAULT 0,
    advance_paid numeric(14,2) DEFAULT 0,
    balance_due numeric(14,2) DEFAULT 0,
    booking_date date DEFAULT CURRENT_DATE,
    delivery_date date,
    status character varying(30) DEFAULT 'booked'::character varying,
    cancellation_reason text,
    refund_amount numeric(14,2) DEFAULT 0,
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    gold_grams_locked numeric(10,3) DEFAULT 0,
    silver_grams_locked numeric(10,3) DEFAULT 0,
    total_deposits numeric(14,2) DEFAULT 0,
    cancellation_id integer,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL
);


--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: buyback_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.buyback_items (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    buyback_id integer NOT NULL,
    order_item_id integer,
    item_id integer,
    item_code character varying(30),
    description character varying(300) NOT NULL,
    metal_type character varying(30),
    purity character varying(20),
    qty integer DEFAULT 1 NOT NULL,
    gross_weight numeric(12,3) DEFAULT 0 NOT NULL,
    stone_weight numeric(12,3) DEFAULT 0 NOT NULL,
    net_weight numeric(12,3) DEFAULT 0 NOT NULL,
    rate_per_10g numeric(14,2) DEFAULT 0 NOT NULL,
    metal_value numeric(14,2) DEFAULT 0 NOT NULL,
    refining_pct numeric(7,3) DEFAULT 0 NOT NULL,
    refining_amount numeric(14,2) DEFAULT 0 NOT NULL,
    diamond_value numeric(14,2) DEFAULT 0 NOT NULL,
    diamond_pct numeric(7,3) DEFAULT 0 NOT NULL,
    gem_value numeric(14,2) DEFAULT 0 NOT NULL,
    gem_pct numeric(7,3) DEFAULT 0 NOT NULL,
    stone_value numeric(14,2) DEFAULT 0 NOT NULL,
    other_deduction numeric(14,2) DEFAULT 0 NOT NULL,
    net_amount numeric(14,2) DEFAULT 0 NOT NULL,
    stock_action character varying(10) DEFAULT 'restock'::character varying NOT NULL,
    CONSTRAINT buyback_items_stock_action_check CHECK (((stock_action)::text = ANY ((ARRAY['restock'::character varying, 'melt'::character varying])::text[])))
);


--
-- Name: buyback_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.buyback_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: buyback_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.buyback_items_id_seq OWNED BY public.buyback_items.id;


--
-- Name: buybacks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.buybacks (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    buyback_no character varying(30) NOT NULL,
    buyback_date date DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata'::text))::date NOT NULL,
    customer_id integer,
    customer_name character varying(200),
    order_id integer,
    order_no character varying(30),
    invoice_date date,
    gross_value numeric(14,2) DEFAULT 0 NOT NULL,
    total_deduction numeric(14,2) DEFAULT 0 NOT NULL,
    net_amount numeric(14,2) DEFAULT 0 NOT NULL,
    refund_amount numeric(14,2) DEFAULT 0 NOT NULL,
    credit_amount numeric(14,2) DEFAULT 0 NOT NULL,
    refining_pct numeric(7,3),
    diamond_pct numeric(7,3),
    gem_pct numeric(7,3),
    status character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    notes text,
    cancel_reason text,
    cancelled_at timestamp with time zone,
    cancelled_by integer,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT buybacks_status_check CHECK (((status)::text = ANY ((ARRAY['completed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: buybacks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.buybacks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: buybacks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.buybacks_id_seq OWNED BY public.buybacks.id;


--
-- Name: cancellation_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cancellation_items (
    id integer NOT NULL,
    cancellation_id integer NOT NULL,
    order_item_id integer,
    item_code character varying(30),
    item_name character varying(300),
    quantity integer DEFAULT 1,
    unit_price numeric(14,2) DEFAULT 0,
    total_amount numeric(14,2) DEFAULT 0,
    gst_amount numeric(14,2) DEFAULT 0,
    inventory_id integer,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL
);


--
-- Name: cancellation_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cancellation_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cancellation_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cancellation_items_id_seq OWNED BY public.cancellation_items.id;


--
-- Name: cancellations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cancellations (
    id integer NOT NULL,
    cancellation_no character varying(30),
    reference_type character varying(20),
    reference_id integer,
    reference_no character varying(30),
    customer_id integer,
    customer_name character varying(200),
    reason text NOT NULL,
    total_amount numeric(14,2) DEFAULT 0,
    paid_amount numeric(14,2) DEFAULT 0,
    deduction_amount numeric(14,2) DEFAULT 0,
    refund_amount numeric(14,2) DEFAULT 0,
    refund_mode character varying(30),
    refund_date date,
    status character varying(20) DEFAULT 'pending'::character varying,
    approved_by integer,
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL
);


--
-- Name: cancellations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cancellations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cancellations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cancellations_id_seq OWNED BY public.cancellations.id;


--
-- Name: cash_outflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cash_outflows (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    outflow_no character varying(30) NOT NULL,
    category character varying(40) NOT NULL,
    amount numeric(14,2) NOT NULL,
    payment_mode character varying(30) NOT NULL,
    outflow_date date DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata'::text))::date NOT NULL,
    reference_no character varying(100),
    notes text,
    source_ref character varying(60),
    customer_id integer,
    buyback_id integer,
    supplier_id integer,
    supplier_payment_id integer,
    loan_id integer,
    old_gold_purchase_id integer,
    register_session_id integer,
    voided boolean DEFAULT false NOT NULL,
    void_reason text,
    voided_by integer,
    voided_at timestamp with time zone,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cash_outflows_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT cash_outflows_payment_mode_check CHECK (((payment_mode)::text ~ '^[a-z0-9_]{2,30}$'::text))
);


--
-- Name: cash_outflows_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cash_outflows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cash_outflows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cash_outflows_id_seq OWNED BY public.cash_outflows.id;


--
-- Name: credit_memos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_memos (
    id integer NOT NULL,
    credit_memo_no character varying(30),
    cancellation_id integer,
    order_id integer,
    customer_id integer,
    customer_name character varying(200),
    original_amount numeric(14,2) DEFAULT 0,
    refund_amount numeric(14,2) DEFAULT 0,
    deduction_amount numeric(14,2) DEFAULT 0,
    deduction_reason text,
    refund_mode character varying(30),
    refund_status character varying(20) DEFAULT 'pending'::character varying,
    refund_date date,
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL
);


--
-- Name: credit_memos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.credit_memos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: credit_memos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.credit_memos_id_seq OWNED BY public.credit_memos.id;


--
-- Name: customer_credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_credits (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    customer_id integer NOT NULL,
    txn_date date DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata'::text))::date NOT NULL,
    amount numeric(14,2) NOT NULL,
    source character varying(30) NOT NULL,
    buyback_id integer,
    payment_id integer,
    order_id integer,
    ref_no character varying(60),
    notes text,
    voided boolean DEFAULT false NOT NULL,
    void_reason text,
    voided_by integer,
    voided_at timestamp with time zone,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT customer_credits_amount_check CHECK ((amount <> (0)::numeric))
);


--
-- Name: customer_credits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_credits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_credits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_credits_id_seq OWNED BY public.customer_credits.id;


--
-- Name: customer_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_visits (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    customer_id integer NOT NULL,
    visit_date date DEFAULT CURRENT_DATE NOT NULL,
    purpose character varying(100),
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_visits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_visits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_visits_id_seq OWNED BY public.customer_visits.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    customer_code character varying(20),
    name character varying(200) NOT NULL,
    phone character varying(20) NOT NULL,
    phone2 character varying(20),
    email character varying(200),
    street1 text,
    street2 character varying(200),
    city character varying(100),
    state character varying(100),
    pincode character varying(10),
    aadhar_no character varying(20),
    pan_no character varying(20),
    gst_no character varying(30),
    dob date,
    anniversary date,
    father_name character varying(200),
    father_mobile character varying(20),
    mother_name character varying(200),
    mother_mobile character varying(20),
    brother_name character varying(200),
    brother_mobile character varying(20),
    son_name character varying(200),
    son_mobile character varying(20),
    daughter_name character varying(200),
    daughter_mobile character varying(20),
    customer_type character varying(20) DEFAULT 'retail'::character varying,
    credit_limit numeric(14,2) DEFAULT 0,
    opening_balance numeric(14,2) DEFAULT 0,
    total_purchased numeric(14,2) DEFAULT 0,
    loyalty_points integer DEFAULT 0,
    notes text,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    form60 boolean DEFAULT false NOT NULL,
    last_visit_date date,
    state_code character varying(2),
    guarantor_name character varying(200),
    guarantor_mobile character varying(20),
    external_ref character varying(100),
    CONSTRAINT customers_customer_type_check CHECK (((customer_type)::text = ANY ((ARRAY['retail'::character varying, 'wholesale'::character varying, 'vip'::character varying])::text[])))
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: daily_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_rates (
    id integer NOT NULL,
    rate_date date NOT NULL,
    gold_22k numeric(10,2),
    gold_24k numeric(10,2),
    gold_18k numeric(10,2),
    gold_14k numeric(10,2),
    silver numeric(10,2),
    platinum numeric(10,2),
    dollar_rate numeric(10,2),
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    silver_per_10g numeric(10,2)
);


--
-- Name: daily_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_rates_id_seq OWNED BY public.daily_rates.id;


--
-- Name: deposit_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deposit_payments (
    id integer NOT NULL,
    deposit_id integer NOT NULL,
    month_no integer,
    payment_date date DEFAULT CURRENT_DATE,
    amount numeric(14,2) NOT NULL,
    payment_mode character varying(30),
    status character varying(20) DEFAULT 'paid'::character varying,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    payment_id integer,
    voided boolean DEFAULT false
);


--
-- Name: deposit_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.deposit_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: deposit_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.deposit_payments_id_seq OWNED BY public.deposit_payments.id;


--
-- Name: deposits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deposits (
    id integer NOT NULL,
    deposit_no character varying(30),
    customer_id integer,
    scheme_type character varying(30) DEFAULT 'monthly_gold'::character varying,
    scheme_name character varying(200),
    monthly_amount numeric(14,2) NOT NULL,
    tenure_months integer,
    start_date date DEFAULT CURRENT_DATE,
    end_date date,
    interest_rate numeric(5,2) DEFAULT 0,
    metal_weight numeric(10,3) DEFAULT 0,
    purity character varying(20),
    total_paid numeric(14,2) DEFAULT 0,
    bonus_amount numeric(14,2) DEFAULT 0,
    maturity_value numeric(14,2) DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    bonus_instalments integer DEFAULT 1,
    redeemed_at timestamp with time zone,
    redeemed_value numeric(14,2),
    redeemed_bonus numeric(14,2),
    redeemed_by integer,
    close_reason text
);


--
-- Name: deposits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.deposits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: deposits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.deposits_id_seq OWNED BY public.deposits.id;


--
-- Name: doc_counters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doc_counters (
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    series character varying(80) NOT NULL,
    period character varying(20) DEFAULT ''::character varying NOT NULL,
    last_no bigint DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_links (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    entity_type character varying(30) NOT NULL,
    entity_id character varying(40) NOT NULL,
    file_id uuid NOT NULL,
    doc_type character varying(40) DEFAULT 'other'::character varying NOT NULL,
    note text,
    uploaded_by integer,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    removed_at timestamp with time zone,
    removed_by integer,
    remove_reason text
);


--
-- Name: document_links_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.document_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: document_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.document_links_id_seq OWNED BY public.document_links.id;


--
-- Name: domain_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.domain_events (
    id bigint NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    event_id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type character varying(60) NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    dispatched_at timestamp with time zone
);


--
-- Name: domain_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.domain_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: domain_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.domain_events_id_seq OWNED BY public.domain_events.id;


--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.error_logs (
    id bigint NOT NULL,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    source character varying(20) DEFAULT 'server'::character varying NOT NULL,
    severity character varying(10) DEFAULT 'error'::character varying NOT NULL,
    tenant_id uuid,
    user_id integer,
    request_id character varying(64),
    route text,
    method character varying(10),
    http_status integer,
    error_code character varying(50),
    message text,
    stack text,
    context jsonb DEFAULT '{}'::jsonb NOT NULL,
    app_version character varying(30),
    user_agent text,
    ip character varying(64),
    fingerprint character varying(64) NOT NULL,
    count integer DEFAULT 1 NOT NULL,
    first_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(10) DEFAULT 'new'::character varying NOT NULL,
    resolved_by character varying(200),
    resolved_at timestamp with time zone,
    CONSTRAINT error_logs_severity_check CHECK (((severity)::text = ANY ((ARRAY['error'::character varying, 'warn'::character varying, 'fatal'::character varying])::text[]))),
    CONSTRAINT error_logs_source_check CHECK (((source)::text = ANY ((ARRAY['server'::character varying, 'client'::character varying, 'job'::character varying, 'webhook'::character varying, 'integration'::character varying])::text[]))),
    CONSTRAINT error_logs_status_check CHECK (((status)::text = ANY ((ARRAY['new'::character varying, 'seen'::character varying, 'resolved'::character varying])::text[])))
);


--
-- Name: error_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.error_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: error_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.error_logs_id_seq OWNED BY public.error_logs.id;


--
-- Name: file_blobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_blobs (
    file_id uuid NOT NULL,
    variant character varying(10) NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    mime_type character varying(100) NOT NULL,
    data bytea NOT NULL
);


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    storage character varying(10) DEFAULT 'db'::character varying NOT NULL,
    storage_key text,
    original_name character varying(255),
    mime_type character varying(100) NOT NULL,
    size_bytes integer NOT NULL,
    sha256 character(64) NOT NULL,
    width integer,
    height integer,
    purpose character varying(30),
    uploaded_by integer,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by integer,
    scan_status character varying(20) DEFAULT 'not_scanned'::character varying NOT NULL
);


--
-- Name: gateway_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gateway_events (
    id bigint NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    provider character varying(20) NOT NULL,
    event_id character varying(120) NOT NULL,
    event_type character varying(60),
    payload jsonb NOT NULL,
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    result text
);


--
-- Name: gateway_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gateway_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gateway_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gateway_events_id_seq OWNED BY public.gateway_events.id;


--
-- Name: goods_receipt_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goods_receipt_lines (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    grn_id integer NOT NULL,
    line_no integer NOT NULL,
    po_line_id integer,
    description character varying(300) NOT NULL,
    metal_type character varying(30),
    purity character varying(20),
    hsn character varying(10),
    category character varying(30),
    received_qty integer DEFAULT 0 NOT NULL,
    accepted_qty integer DEFAULT 0 NOT NULL,
    rejected_qty integer DEFAULT 0 NOT NULL,
    reject_reason text,
    gross_weight numeric(12,3) DEFAULT 0 NOT NULL,
    net_weight numeric(12,3) DEFAULT 0 NOT NULL,
    stone_weight numeric(12,3) DEFAULT 0 NOT NULL,
    expected_net numeric(12,3),
    tolerance_ok boolean DEFAULT true NOT NULL,
    cost_per_piece numeric(14,2) DEFAULT 0 NOT NULL,
    rate_basis character varying(10),
    rate numeric(14,2),
    gst_pct numeric(7,3),
    stock_mode character varying(20) DEFAULT 'tag_per_piece'::character varying NOT NULL,
    item_id integer,
    prev_item_state jsonb,
    billed_qty integer DEFAULT 0 NOT NULL,
    stones jsonb DEFAULT '[]'::jsonb NOT NULL,
    item_type character varying(100),
    retail_margin_pct numeric(7,2),
    wholesale_margin_pct numeric(7,2),
    CONSTRAINT goods_receipt_lines_stock_mode_check CHECK (((stock_mode)::text = ANY ((ARRAY['tag_per_piece'::character varying, 'single_code'::character varying, 'add_existing'::character varying])::text[])))
);


--
-- Name: goods_receipt_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.goods_receipt_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: goods_receipt_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goods_receipt_lines_id_seq OWNED BY public.goods_receipt_lines.id;


--
-- Name: goods_receipt_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goods_receipt_tags (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    grn_line_id integer NOT NULL,
    item_id integer NOT NULL,
    item_code character varying(30) NOT NULL
);


--
-- Name: goods_receipt_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.goods_receipt_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: goods_receipt_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goods_receipt_tags_id_seq OWNED BY public.goods_receipt_tags.id;


--
-- Name: goods_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goods_receipts (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    grn_no character varying(30) NOT NULL,
    supplier_id integer NOT NULL,
    po_id integer,
    grn_date date DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata'::text))::date NOT NULL,
    challan_no character varying(60),
    status character varying(20) DEFAULT 'posted'::character varying NOT NULL,
    notes text,
    override_by integer,
    override_reason text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    reversed_by integer,
    reversed_at timestamp with time zone,
    reverse_reason text,
    CONSTRAINT goods_receipts_status_check CHECK (((status)::text = ANY ((ARRAY['posted'::character varying, 'reversed'::character varying])::text[])))
);


--
-- Name: goods_receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.goods_receipts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: goods_receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goods_receipts_id_seq OWNED BY public.goods_receipts.id;


--
-- Name: gst_2b_imports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gst_2b_imports (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    period character varying(7) NOT NULL,
    file_name character varying(200),
    source character varying(10) NOT NULL,
    line_count integer DEFAULT 0 NOT NULL,
    totals jsonb,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gst_2b_imports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gst_2b_imports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gst_2b_imports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gst_2b_imports_id_seq OWNED BY public.gst_2b_imports.id;


--
-- Name: gst_2b_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gst_2b_lines (
    id bigint NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    import_id integer NOT NULL,
    doc_type character varying(5) DEFAULT 'B2B'::character varying NOT NULL,
    note_type character varying(2),
    supplier_gstin character varying(15) NOT NULL,
    supplier_name character varying(200),
    doc_no character varying(60) NOT NULL,
    doc_date date,
    doc_value numeric(14,2) DEFAULT 0 NOT NULL,
    pos character varying(2),
    reverse_charge boolean DEFAULT false NOT NULL,
    taxable numeric(14,2) DEFAULT 0 NOT NULL,
    igst numeric(14,2) DEFAULT 0 NOT NULL,
    cgst numeric(14,2) DEFAULT 0 NOT NULL,
    sgst numeric(14,2) DEFAULT 0 NOT NULL,
    cess numeric(14,2) DEFAULT 0 NOT NULL,
    itc_available boolean DEFAULT true NOT NULL,
    filing_period character varying(10),
    reason text
);


--
-- Name: gst_2b_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gst_2b_lines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gst_2b_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gst_2b_lines_id_seq OWNED BY public.gst_2b_lines.id;


--
-- Name: idempotency_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.idempotency_keys (
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    actor character varying(60) NOT NULL,
    key character varying(100) NOT NULL,
    method character varying(10) NOT NULL,
    path character varying(300) NOT NULL,
    request_hash character(64) NOT NULL,
    status_code integer,
    response jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: integration_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_credentials (
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    provider character varying(30) NOT NULL,
    data_enc text NOT NULL,
    updated_by integer,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory (
    id integer NOT NULL,
    item_code character varying(30),
    name character varying(300) NOT NULL,
    image_url text,
    category character varying(30),
    sub_category character varying(100),
    metal_type character varying(50),
    purity character varying(20),
    huid character varying(20),
    gross_weight numeric(10,3) DEFAULT 0,
    net_weight numeric(10,3) DEFAULT 0,
    stone_weight numeric(10,3) DEFAULT 0,
    wastage_pct numeric(5,2) DEFAULT 0,
    making_charge numeric(10,2) DEFAULT 0,
    making_type character varying(20) DEFAULT 'per_gram'::character varying,
    stone_charge numeric(10,2) DEFAULT 0,
    mrp numeric(14,2) DEFAULT 0,
    cost_price numeric(14,2) DEFAULT 0,
    hsn character varying(20),
    barcode character varying(100),
    location character varying(100),
    rack character varying(50),
    quantity integer DEFAULT 1,
    min_stock integer DEFAULT 1,
    description text,
    is_active boolean DEFAULT true,
    supplier_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    reserved_quantity integer DEFAULT 0 NOT NULL,
    sold_quantity integer DEFAULT 0 NOT NULL,
    stone_value numeric(14,2) DEFAULT 0 NOT NULL,
    external_ref character varying(100),
    row_version integer DEFAULT 1 NOT NULL,
    item_size character varying(30),
    design_no character varying(60),
    gender character varying(10),
    retail_margin_pct numeric(7,2),
    wholesale_margin_pct numeric(7,2),
    retail_price numeric(14,2),
    wholesale_price numeric(14,2),
    created_by integer,
    CONSTRAINT inventory_category_check CHECK (((category)::text = ANY ((ARRAY['gold'::character varying, 'silver'::character varying, 'platinum'::character varying, 'diamond'::character varying, 'gemstone'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT inventory_margin_range CHECK ((((retail_margin_pct IS NULL) OR ((retail_margin_pct >= ('-100'::integer)::numeric) AND (retail_margin_pct <= (1000)::numeric))) AND ((wholesale_margin_pct IS NULL) OR ((wholesale_margin_pct >= ('-100'::integer)::numeric) AND (wholesale_margin_pct <= (1000)::numeric)))))
);


--
-- Name: inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_id_seq OWNED BY public.inventory.id;


--
-- Name: inventory_stones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_stones (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    item_id integer NOT NULL,
    line_no integer DEFAULT 1 NOT NULL,
    stone_type character varying(40),
    shape character varying(40),
    clarity character varying(20),
    colour character varying(20),
    pcs integer DEFAULT 1 NOT NULL,
    carat numeric(12,3) DEFAULT 0 NOT NULL,
    rate_per_ct numeric(14,2) DEFAULT 0 NOT NULL,
    rate_type character varying(10) DEFAULT 'per_ct'::character varying NOT NULL,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    stone_group character varying(20) DEFAULT 'diamond'::character varying NOT NULL,
    stone_name character varying(60),
    cut character varying(40),
    size character varying(30),
    setting character varying(30),
    weight_g numeric(12,3) DEFAULT 0 NOT NULL,
    origin character varying(20),
    certificate_no character varying(60),
    lab character varying(30),
    notes character varying(200),
    CONSTRAINT inventory_stones_rate_type_check CHECK (((rate_type)::text = ANY ((ARRAY['per_ct'::character varying, 'per_pc'::character varying, 'per_g'::character varying, 'fixed'::character varying])::text[])))
);


--
-- Name: inventory_stones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_stones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_stones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_stones_id_seq OWNED BY public.inventory_stones.id;


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_transactions (
    id bigint NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    item_id integer NOT NULL,
    txn_type character varying(20) NOT NULL,
    reference_no character varying(60),
    qty_change integer NOT NULL,
    balance_after integer NOT NULL,
    posting_ref character varying(120),
    supplier_id integer,
    notes text,
    txn_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by integer,
    reason character varying(40)
);


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_transactions_id_seq OWNED BY public.inventory_transactions.id;


--
-- Name: item_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_images (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    item_id integer NOT NULL,
    file_id uuid NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    caption character varying(200),
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    removed_at timestamp with time zone
);


--
-- Name: item_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.item_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.item_images_id_seq OWNED BY public.item_images.id;


--
-- Name: kj_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kj_migrations (
    version text NOT NULL,
    name text NOT NULL,
    checksum text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL,
    duration_ms integer
);


--
-- Name: license_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.license_keys (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    license_key character varying(100) NOT NULL,
    expires_on date,
    server_status character varying(20) DEFAULT 'found'::character varying NOT NULL,
    max_users integer,
    message text,
    last_verified_at timestamp with time zone,
    last_checked_at timestamp with time zone,
    last_response jsonb,
    added_by integer,
    added_at timestamp with time zone DEFAULT now() NOT NULL,
    source character varying(20) DEFAULT 'salesforce'::character varying NOT NULL,
    machine_id character varying(200),
    module character varying(40),
    remote_state character varying(30),
    error_code character varying(40),
    customer_name character varying(200),
    start_date date,
    activated_at timestamp with time zone,
    token text,
    token_expires_at timestamp with time zone,
    token_verified boolean,
    CONSTRAINT license_keys_server_status_check CHECK (((server_status)::text = ANY ((ARRAY['found'::character varying, 'not_found'::character varying, 'blocked'::character varying])::text[])))
);


--
-- Name: license_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.license_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: license_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.license_keys_id_seq OWNED BY public.license_keys.id;


--
-- Name: licenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    license_key character varying(100),
    plan character varying(50),
    max_users integer,
    starts_on date,
    expires_on date,
    status character varying(20) DEFAULT 'missing'::character varying NOT NULL,
    message text,
    last_verified_at timestamp with time zone,
    last_checked_at timestamp with time zone,
    last_response jsonb,
    grace_days integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT licenses_status_check CHECK (((status)::text = ANY ((ARRAY['missing'::character varying, 'unverified'::character varying, 'valid'::character varying, 'expired'::character varying, 'invalid'::character varying])::text[])))
);


--
-- Name: loan_emi_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_emi_records (
    id integer NOT NULL,
    loan_id integer NOT NULL,
    payment_no character varying(30),
    period_start date NOT NULL,
    period_end date NOT NULL,
    days_in_period integer NOT NULL,
    principal_for_period numeric(14,2) NOT NULL,
    calculated_interest numeric(14,2) NOT NULL,
    adjusted_interest numeric(14,2),
    interest_collected numeric(14,2) DEFAULT 0 NOT NULL,
    principal_collected numeric(14,2) DEFAULT 0 NOT NULL,
    total_collected numeric(14,2) DEFAULT 0 NOT NULL,
    adjustment_reason text,
    payment_mode character varying(30),
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL
);


--
-- Name: loan_emi_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.loan_emi_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: loan_emi_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.loan_emi_records_id_seq OWNED BY public.loan_emi_records.id;


--
-- Name: loan_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_items (
    id integer NOT NULL,
    loan_id integer NOT NULL,
    description character varying(300),
    purity character varying(20),
    gross_weight numeric(10,3),
    net_weight numeric(10,3),
    item_value numeric(14,2),
    metal_type character varying(30) DEFAULT 'gold'::character varying,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    item_name character varying(200),
    item_type character varying(20),
    quantity integer DEFAULT 1 NOT NULL,
    tag_no character varying(60),
    locker_location character varying(120),
    item_status character varying(10) DEFAULT 'held'::character varying NOT NULL,
    returned_date date,
    returned_by integer
);


--
-- Name: loan_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.loan_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: loan_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.loan_items_id_seq OWNED BY public.loan_items.id;


--
-- Name: loan_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_transactions (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    loan_id integer NOT NULL,
    txn_date date NOT NULL,
    txn_type character varying(40) NOT NULL,
    principal_amount numeric(14,2) DEFAULT 0 NOT NULL,
    interest_amount numeric(14,2) DEFAULT 0 NOT NULL,
    waiver_amount numeric(14,2) DEFAULT 0 NOT NULL,
    total_collected numeric(14,2) DEFAULT 0 NOT NULL,
    payment_mode character varying(30),
    reference_no character varying(100),
    notes text,
    payment_id integer,
    voided boolean DEFAULT false NOT NULL,
    voided_at timestamp with time zone,
    void_reason text,
    legacy_emi_id integer,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loan_transactions_interest_amount_check CHECK ((interest_amount >= (0)::numeric)),
    CONSTRAINT loan_transactions_principal_amount_check CHECK ((principal_amount >= (0)::numeric)),
    CONSTRAINT loan_transactions_waiver_amount_check CHECK ((waiver_amount >= (0)::numeric))
);


--
-- Name: loan_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.loan_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: loan_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.loan_transactions_id_seq OWNED BY public.loan_transactions.id;


--
-- Name: loans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loans (
    id integer NOT NULL,
    loan_no character varying(30),
    customer_id integer,
    customer_name character varying(200),
    phone character varying(20),
    loan_type character varying(30) DEFAULT 'gold_loan'::character varying,
    loan_amount numeric(14,2) NOT NULL,
    interest_rate numeric(5,2) NOT NULL,
    interest_type character varying(20) DEFAULT 'simple'::character varying,
    tenure_months integer,
    issue_date date DEFAULT CURRENT_DATE,
    due_date date,
    total_item_value numeric(14,2) DEFAULT 0,
    total_interest numeric(14,2) DEFAULT 0,
    total_due numeric(14,2) DEFAULT 0,
    paid_amount numeric(14,2) DEFAULT 0,
    balance_due numeric(14,2) DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    interest_adjustment numeric(14,2) DEFAULT NULL::numeric,
    interest_paid numeric(14,2) DEFAULT 0,
    principal_paid numeric(14,2) DEFAULT 0,
    last_interest_date date,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    rate_basis character varying(10) DEFAULT 'monthly'::character varying NOT NULL,
    interest_waived numeric(14,2) DEFAULT 0 NOT NULL,
    guarantor_name character varying(200),
    guarantor_mobile character varying(20),
    CONSTRAINT loans_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'principal_cleared'::character varying, 'closed'::character varying, 'overdue'::character varying, 'foreclosed'::character varying])::text[])))
);


--
-- Name: loans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.loans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: loans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.loans_id_seq OWNED BY public.loans.id;


--
-- Name: metal_stock_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metal_stock_history (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    movement_id integer NOT NULL,
    from_status character varying(20),
    to_status character varying(20) NOT NULL,
    tested_purity character varying(20),
    fine_weight numeric(12,3),
    note text NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: metal_stock_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.metal_stock_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: metal_stock_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metal_stock_history_id_seq OWNED BY public.metal_stock_history.id;


--
-- Name: metal_stock_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metal_stock_movements (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    movement_date date DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata'::text))::date NOT NULL,
    metal character varying(20) DEFAULT 'gold'::character varying NOT NULL,
    purity character varying(20),
    tested_purity character varying(20),
    description character varying(300),
    gross_weight numeric(12,3) DEFAULT 0 NOT NULL,
    net_weight numeric(12,3) DEFAULT 0 NOT NULL,
    fine_weight numeric(12,3),
    value numeric(14,2),
    movement_type character varying(20) NOT NULL,
    source_type character varying(30),
    source_id integer,
    source_no character varying(40),
    posting_ref character varying(80),
    status character varying(20) DEFAULT 'pending_test'::character varying NOT NULL,
    refiner character varying(100),
    notes text,
    row_version integer DEFAULT 1 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    refinery_job_id integer,
    status_before_job character varying(20),
    CONSTRAINT metal_stock_movements_status_check CHECK (((status)::text = ANY ((ARRAY['pending_test'::character varying, 'in_stock'::character varying, 'at_refiner'::character varying, 'closed'::character varying])::text[])))
);


--
-- Name: metal_stock_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.metal_stock_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: metal_stock_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metal_stock_movements_id_seq OWNED BY public.metal_stock_movements.id;


--
-- Name: old_gold_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.old_gold_items (
    id integer NOT NULL,
    purchase_id integer NOT NULL,
    description character varying(200) NOT NULL,
    metal_type character varying(20) DEFAULT 'gold'::character varying,
    purity character varying(30),
    gross_weight numeric(10,3) DEFAULT 0 NOT NULL,
    deductions numeric(10,3) DEFAULT 0 NOT NULL,
    net_weight numeric(10,3) DEFAULT 0 NOT NULL,
    rate_per_10g numeric(14,2) DEFAULT 0 NOT NULL,
    value numeric(14,2) DEFAULT 0 NOT NULL,
    touch_purity character varying(20),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    pieces integer DEFAULT 1 NOT NULL,
    stone_weight numeric(10,3) DEFAULT 0 NOT NULL,
    other_deduction numeric(10,3) DEFAULT 0 NOT NULL,
    fine_weight numeric(10,3),
    rate_basis character varying(20) DEFAULT 'per_10g'::character varying NOT NULL,
    test_status character varying(20),
    CONSTRAINT old_gold_items_rate_basis_chk CHECK (((rate_basis)::text = ANY ((ARRAY['per_10g'::character varying, 'fine_per_10g'::character varying])::text[])))
);


--
-- Name: old_gold_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.old_gold_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: old_gold_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.old_gold_items_id_seq OWNED BY public.old_gold_items.id;


--
-- Name: old_gold_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.old_gold_payments (
    id integer NOT NULL,
    purchase_id integer NOT NULL,
    payment_no character varying(30) NOT NULL,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    payment_mode character varying(30) DEFAULT 'cash'::character varying,
    reference_no character varying(100),
    notes text,
    voided boolean DEFAULT false,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL
);


--
-- Name: old_gold_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.old_gold_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: old_gold_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.old_gold_payments_id_seq OWNED BY public.old_gold_payments.id;


--
-- Name: old_gold_purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.old_gold_purchases (
    id integer NOT NULL,
    purchase_no character varying(30) NOT NULL,
    customer_id integer,
    customer_name character varying(200) NOT NULL,
    customer_phone character varying(20),
    purchase_date date DEFAULT CURRENT_DATE NOT NULL,
    order_id integer,
    total_value numeric(14,2) DEFAULT 0 NOT NULL,
    cash_paid numeric(14,2) DEFAULT 0 NOT NULL,
    adjusted_in_invoice numeric(14,2) DEFAULT 0 NOT NULL,
    payment_mode character varying(30) DEFAULT 'cash'::character varying,
    reference_no character varying(100),
    status character varying(20) DEFAULT 'completed'::character varying,
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    excess_owed numeric(14,2) DEFAULT 0 NOT NULL,
    stone_weight_total numeric(12,3) DEFAULT 0 NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL
);


--
-- Name: old_gold_purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.old_gold_purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: old_gold_purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.old_gold_purchases_id_seq OWNED BY public.old_gold_purchases.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    inventory_id integer,
    item_code character varying(30),
    item_name character varying(300),
    category character varying(30),
    purity character varying(20),
    huid character varying(20),
    gross_weight numeric(10,3) DEFAULT 0,
    net_weight numeric(10,3) DEFAULT 0,
    metal_rate numeric(10,2) DEFAULT 0,
    making_charge numeric(10,2) DEFAULT 0,
    making_type character varying(20) DEFAULT 'per_gram'::character varying,
    stone_charge numeric(10,2) DEFAULT 0,
    quantity integer DEFAULT 1,
    unit_price numeric(14,2) DEFAULT 0,
    discount numeric(10,2) DEFAULT 0,
    gst_pct numeric(5,2) DEFAULT 0,
    gst_amount numeric(14,2) DEFAULT 0,
    total_amount numeric(14,2) DEFAULT 0,
    delivered_qty integer DEFAULT 0,
    cancelled_qty integer DEFAULT 0,
    item_status character varying(20) DEFAULT 'pending'::character varying,
    delivery_date date,
    booking_item_id integer,
    booked_weight numeric(10,3) DEFAULT 0,
    balance_weight numeric(10,3) DEFAULT 0,
    booking_rate numeric(14,2) DEFAULT 0,
    delivery_rate numeric(14,2) DEFAULT 0,
    balance_amount numeric(14,2) DEFAULT 0,
    deposit_payment_no character varying(30),
    allocation_status character varying(20) DEFAULT 'pending'::character varying,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    hsn_code character varying(10),
    returned_qty integer DEFAULT 0 NOT NULL,
    restocked_qty integer DEFAULT 0 NOT NULL,
    stones jsonb,
    stone_weight numeric(10,3),
    metal_type character varying(50),
    item_type character varying(100),
    wastage_pct numeric(5,2),
    cost_price numeric(14,2),
    retail_price numeric(14,2),
    wholesale_price numeric(14,2),
    price_mode character varying(12),
    hm_charge numeric(12,2) DEFAULT 0 NOT NULL,
    line_discount numeric(12,2) DEFAULT 0 NOT NULL,
    making_amount numeric(14,2),
    CONSTRAINT order_items_price_mode_check CHECK (((price_mode IS NULL) OR ((price_mode)::text = ANY ((ARRAY['retail'::character varying, 'wholesale'::character varying, 'daily_rate'::character varying, 'mrp'::character varying, 'manual'::character varying])::text[]))))
);


--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_no character varying(30),
    order_type character varying(20) NOT NULL,
    customer_id integer,
    supplier_id integer,
    customer_name character varying(200),
    subtotal numeric(14,2) DEFAULT 0,
    discount_amount numeric(14,2) DEFAULT 0,
    discount_pct numeric(5,2) DEFAULT 0,
    taxable_amount numeric(14,2) DEFAULT 0,
    cgst_amount numeric(14,2) DEFAULT 0,
    sgst_amount numeric(14,2) DEFAULT 0,
    igst_amount numeric(14,2) DEFAULT 0,
    total_gst numeric(14,2) DEFAULT 0,
    gst_applied boolean DEFAULT false,
    total_amount numeric(14,2) DEFAULT 0,
    paid_amount numeric(14,2) DEFAULT 0,
    pending_amount numeric(14,2) DEFAULT 0,
    status character varying(20) DEFAULT 'completed'::character varying,
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    cancellation_id integer,
    cancelled_amount numeric(14,2) DEFAULT 0,
    refund_amount numeric(14,2) DEFAULT 0,
    booking_id integer,
    old_gold_value numeric(14,2) DEFAULT 0,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    place_of_supply character varying(2),
    external_ref character varying(100),
    CONSTRAINT orders_order_type_check CHECK (((order_type)::text = ANY ((ARRAY['sale'::character varying, 'purchase'::character varying, 'return'::character varying, 'exchange'::character varying])::text[]))),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'returned'::character varying, 'partially_paid'::character varying, 'paid'::character varying, 'partially_delivered'::character varying, 'delivered'::character varying])::text[])))
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(128) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL
);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: payment_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_allocations (
    id integer NOT NULL,
    order_id integer,
    order_item_id integer,
    booking_id integer,
    deposit_id integer,
    payment_no character varying(30),
    metal_type character varying(20),
    booked_weight numeric(10,3),
    booking_rate numeric(14,2),
    booking_amount numeric(14,2),
    item_weight numeric(10,3),
    balance_weight numeric(10,3),
    delivery_rate numeric(14,2),
    balance_amount numeric(14,2),
    adjustment_type character varying(20),
    credit_memo_id integer,
    status character varying(20) DEFAULT 'pending'::character varying,
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    allocated_weight numeric(10,3) DEFAULT 0,
    deposit_remaining_after numeric(10,3) DEFAULT 0,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    rate_benefit numeric(14,2) DEFAULT 0 NOT NULL,
    gst_credit numeric(14,2) DEFAULT 0 NOT NULL
);


--
-- Name: payment_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_allocations_id_seq OWNED BY public.payment_allocations.id;


--
-- Name: payment_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_links (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    provider character varying(20) NOT NULL,
    order_id integer,
    repair_id integer,
    amount numeric(14,2) NOT NULL,
    provider_link_id character varying(100) NOT NULL,
    short_url character varying(300),
    status character varying(20) DEFAULT 'created'::character varying NOT NULL,
    payment_id integer,
    gateway_payment_id character varying(100),
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    paid_at timestamp with time zone
);


--
-- Name: payment_links_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_links_id_seq OWNED BY public.payment_links.id;


--
-- Name: payment_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_receipts (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    payment_id integer NOT NULL,
    receipt_no character varying(40) NOT NULL,
    snapshot jsonb NOT NULL,
    first_printed_at timestamp with time zone DEFAULT now() NOT NULL,
    first_printed_by integer,
    last_printed_at timestamp with time zone DEFAULT now() NOT NULL,
    print_count integer DEFAULT 1 NOT NULL
);


--
-- Name: payment_receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_receipts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_receipts_id_seq OWNED BY public.payment_receipts.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    payment_no character varying(30),
    order_id integer,
    customer_id integer,
    loan_id integer,
    booking_id integer,
    deposit_id integer,
    payment_for character varying(30) DEFAULT 'order'::character varying,
    amount numeric(14,2) NOT NULL,
    payment_mode character varying(30) NOT NULL,
    reference_no character varying(100),
    bank_name character varying(100),
    cheque_no character varying(50),
    cheque_date date,
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    repair_id integer,
    order_type character varying(20),
    credit_memo_id integer,
    is_refund boolean DEFAULT false,
    booking_deposit_id integer,
    voided boolean DEFAULT false,
    voided_at timestamp with time zone,
    voided_by integer,
    void_reason text,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    external_ref character varying(100),
    gateway_payment_id character varying(100),
    register_session_id integer,
    loan_txn_id integer,
    allocation_id integer,
    old_gold_purchase_id integer,
    original_amount numeric(14,2),
    metal_type character varying(20),
    rate_per_10g numeric(14,2),
    weight_grams numeric(10,3),
    CONSTRAINT payments_payment_mode_check CHECK (((payment_mode)::text ~ '^[a-z0-9_]{2,30}$'::text))
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    key character varying(60) NOT NULL,
    module character varying(40) NOT NULL,
    action character varying(40) NOT NULL,
    description text
);


--
-- Name: platform_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_users (
    id integer NOT NULL,
    email character varying(200) NOT NULL,
    name character varying(200) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'support'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    failed_logins integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT platform_users_role_check CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'support'::character varying])::text[])))
);


--
-- Name: platform_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.platform_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: platform_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.platform_users_id_seq OWNED BY public.platform_users.id;


--
-- Name: purchase_order_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_order_lines (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    po_id integer NOT NULL,
    line_no integer NOT NULL,
    supplier_item_id integer,
    description character varying(300) NOT NULL,
    metal_type character varying(30),
    purity character varying(20),
    hsn character varying(10),
    qty integer NOT NULL,
    gross_weight numeric(12,3) DEFAULT 0 NOT NULL,
    net_weight numeric(12,3) DEFAULT 0 NOT NULL,
    stone_weight numeric(12,3) DEFAULT 0 NOT NULL,
    rate_basis character varying(10) DEFAULT 'per_gram'::character varying NOT NULL,
    rate numeric(14,2) DEFAULT 0 NOT NULL,
    price_override boolean DEFAULT false NOT NULL,
    discount numeric(14,2) DEFAULT 0 NOT NULL,
    gst_pct numeric(7,3) DEFAULT 3 NOT NULL,
    taxable numeric(14,2) DEFAULT 0 NOT NULL,
    gst_amount numeric(14,2) DEFAULT 0 NOT NULL,
    line_total numeric(14,2) DEFAULT 0 NOT NULL,
    stones jsonb DEFAULT '[]'::jsonb NOT NULL,
    received_qty integer DEFAULT 0 NOT NULL,
    rejected_qty integer DEFAULT 0 NOT NULL,
    item_type character varying(100),
    CONSTRAINT purchase_order_lines_qty_check CHECK ((qty > 0)),
    CONSTRAINT purchase_order_lines_rate_basis_check CHECK (((rate_basis)::text = ANY ((ARRAY['per_gram'::character varying, 'per_ct'::character varying, 'fixed'::character varying])::text[])))
);


--
-- Name: purchase_order_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_order_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_order_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_order_lines_id_seq OWNED BY public.purchase_order_lines.id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    po_no character varying(30) NOT NULL,
    supplier_id integer NOT NULL,
    po_date date DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata'::text))::date NOT NULL,
    expected_date date,
    tax_mode character varying(10) DEFAULT 'intra'::character varying NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    subtotal numeric(14,2) DEFAULT 0 NOT NULL,
    discount numeric(14,2) DEFAULT 0 NOT NULL,
    taxable numeric(14,2) DEFAULT 0 NOT NULL,
    cgst numeric(14,2) DEFAULT 0 NOT NULL,
    sgst numeric(14,2) DEFAULT 0 NOT NULL,
    igst numeric(14,2) DEFAULT 0 NOT NULL,
    other_charges numeric(14,2) DEFAULT 0 NOT NULL,
    total numeric(14,2) DEFAULT 0 NOT NULL,
    terms text,
    notes text,
    delivery_location character varying(300),
    courier character varying(100),
    tracking_no character varying(100),
    created_by integer,
    approved_by integer,
    approved_at timestamp with time zone,
    cancel_reason text,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT purchase_orders_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'partially_received'::character varying, 'received'::character varying, 'closed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT purchase_orders_tax_mode_check CHECK (((tax_mode)::text = ANY ((ARRAY['intra'::character varying, 'inter'::character varying, 'none'::character varying])::text[])))
);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- Name: refined_metal_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refined_metal_ledger (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    entry_date date NOT NULL,
    metal character varying(10) NOT NULL,
    entry_type character varying(30) NOT NULL,
    qty_fine numeric(12,3) NOT NULL,
    purity character varying(20),
    rate_10g numeric(14,2),
    amount numeric(14,2),
    refinery_job_id integer,
    supplier_payment_id integer,
    ref_no character varying(40),
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT refined_metal_ledger_entry_type_check CHECK (((entry_type)::text = ANY ((ARRAY['refinery_receipt'::character varying, 'refinery_receipt_undo'::character varying, 'supplier_payment'::character varying, 'supplier_payment_void'::character varying])::text[]))),
    CONSTRAINT refined_metal_ledger_metal_check CHECK (((metal)::text = ANY ((ARRAY['gold'::character varying, 'silver'::character varying])::text[])))
);


--
-- Name: refined_metal_ledger_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refined_metal_ledger_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refined_metal_ledger_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refined_metal_ledger_id_seq OWNED BY public.refined_metal_ledger.id;


--
-- Name: refinery_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refinery_jobs (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    job_no character varying(30) NOT NULL,
    metal character varying(10) NOT NULL,
    status character varying(12) DEFAULT 'sent'::character varying NOT NULL,
    refiner character varying(120) NOT NULL,
    carried_by character varying(120),
    sent_date date NOT NULL,
    pieces integer DEFAULT 0 NOT NULL,
    sent_gross numeric(12,3) DEFAULT 0 NOT NULL,
    sent_net numeric(12,3) DEFAULT 0 NOT NULL,
    sent_fine numeric(12,3) DEFAULT 0 NOT NULL,
    sent_value numeric(14,2) DEFAULT 0 NOT NULL,
    received_date date,
    received_fine numeric(12,3),
    received_purity character varying(20),
    loss_fine numeric(12,3),
    loss_pct numeric(7,3),
    charges numeric(14,2) DEFAULT 0 NOT NULL,
    charges_outflow_id integer,
    notes text,
    receive_notes text,
    cancel_reason text,
    created_by integer,
    received_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT refinery_jobs_metal_check CHECK (((metal)::text = ANY ((ARRAY['gold'::character varying, 'silver'::character varying])::text[]))),
    CONSTRAINT refinery_jobs_status_check CHECK (((status)::text = ANY ((ARRAY['sent'::character varying, 'received'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: refinery_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refinery_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refinery_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refinery_jobs_id_seq OWNED BY public.refinery_jobs.id;


--
-- Name: register_change_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.register_change_flags (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    session_id integer NOT NULL,
    source character varying(20) NOT NULL,
    source_id integer NOT NULL,
    change text NOT NULL,
    at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: register_change_flags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.register_change_flags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: register_change_flags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.register_change_flags_id_seq OWNED BY public.register_change_flags.id;


--
-- Name: register_counters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.register_counters (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(60) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: register_counters_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.register_counters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: register_counters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.register_counters_id_seq OWNED BY public.register_counters.id;


--
-- Name: register_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.register_entries (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    session_id integer NOT NULL,
    entry_no character varying(30) NOT NULL,
    entry_type character varying(10) NOT NULL,
    category character varying(60) NOT NULL,
    amount numeric(14,2) NOT NULL,
    notes text,
    voided boolean DEFAULT false NOT NULL,
    void_reason text,
    voided_by integer,
    voided_at timestamp with time zone,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT register_entries_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT register_entries_entry_type_check CHECK (((entry_type)::text = ANY ((ARRAY['cash_in'::character varying, 'cash_out'::character varying, 'expense'::character varying])::text[])))
);


--
-- Name: register_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.register_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: register_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.register_entries_id_seq OWNED BY public.register_entries.id;


--
-- Name: register_reopen_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.register_reopen_log (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    session_id integer NOT NULL,
    reopened_by integer,
    reason text NOT NULL,
    previous jsonb NOT NULL,
    at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: register_reopen_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.register_reopen_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: register_reopen_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.register_reopen_log_id_seq OWNED BY public.register_reopen_log.id;


--
-- Name: register_session_modes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.register_session_modes (
    session_id integer NOT NULL,
    mode character varying(30) NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    receipts numeric(14,2) DEFAULT 0 NOT NULL,
    refunds numeric(14,2) DEFAULT 0 NOT NULL,
    net numeric(14,2) DEFAULT 0 NOT NULL,
    count integer DEFAULT 0 NOT NULL
);


--
-- Name: register_session_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.register_session_users (
    session_id integer NOT NULL,
    user_id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    left_at timestamp with time zone
);


--
-- Name: register_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.register_sessions (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    session_no character varying(30) NOT NULL,
    counter_id integer NOT NULL,
    business_date date NOT NULL,
    status character varying(10) DEFAULT 'open'::character varying NOT NULL,
    opening_cash numeric(14,2) DEFAULT 0 NOT NULL,
    opening_counts jsonb,
    opening_remarks text,
    opened_by integer,
    opened_at timestamp with time zone DEFAULT now() NOT NULL,
    closing_started_at timestamp with time zone,
    closing_started_by integer,
    expected_cash numeric(14,2),
    actual_cash numeric(14,2),
    difference numeric(14,2),
    difference_reason text,
    approved_by integer,
    closing_counts jsonb,
    snapshot jsonb,
    closed_by integer,
    closed_at timestamp with time zone,
    reopened_count integer DEFAULT 0 NOT NULL,
    changed_after_close boolean DEFAULT false NOT NULL,
    row_version integer DEFAULT 1 NOT NULL,
    CONSTRAINT register_sessions_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'closing'::character varying, 'closed'::character varying])::text[])))
);


--
-- Name: register_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.register_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: register_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.register_sessions_id_seq OWNED BY public.register_sessions.id;


--
-- Name: repair_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_items (
    id integer NOT NULL,
    repair_id integer NOT NULL,
    description character varying(300),
    metal_type character varying(50),
    gross_weight numeric(10,3),
    issue_type character varying(200),
    special_note text,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    item_status character varying(20) DEFAULT 'pending'::character varying,
    delivery_date date,
    item_type character varying(50),
    quantity integer DEFAULT 1 NOT NULL,
    item_condition character varying(300),
    accessories character varying(300),
    repair_cost numeric(14,2) DEFAULT 0
);


--
-- Name: repair_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.repair_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: repair_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.repair_items_id_seq OWNED BY public.repair_items.id;


--
-- Name: repairs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repairs (
    id integer NOT NULL,
    repair_no character varying(30),
    customer_id integer,
    customer_name character varying(200),
    phone character varying(20),
    estimated_cost numeric(14,2) DEFAULT 0,
    final_cost numeric(14,2) DEFAULT 0,
    advance_paid numeric(14,2) DEFAULT 0,
    balance_due numeric(14,2) DEFAULT 0,
    received_date date DEFAULT CURRENT_DATE,
    promised_date date,
    delivered_date date,
    status character varying(30) DEFAULT 'received'::character varying,
    technician character varying(100),
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    service_type character varying(10) DEFAULT 'repair'::character varying NOT NULL,
    sac_code character varying(10),
    gst_pct numeric(7,3),
    invoice_no character varying(30),
    invoice_date date,
    taxable_amount numeric(14,2),
    gst_amount numeric(14,2),
    invoice_total numeric(14,2),
    receipt_no character varying(30),
    receipt_first_printed timestamp with time zone,
    receipt_print_count integer DEFAULT 0 NOT NULL
);


--
-- Name: repairs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.repairs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: repairs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.repairs_id_seq OWNED BY public.repairs.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_key character varying(60) NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    name character varying(60) NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    system_key character varying(30),
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    ip character varying(64),
    user_agent text,
    revoked_at timestamp with time zone,
    revoked_by integer,
    revoke_reason text
);


--
-- Name: shipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipments (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    shipment_no character varying(30) NOT NULL,
    sales_order_id integer,
    repair_id integer,
    courier character varying(40) DEFAULT 'manual'::character varying NOT NULL,
    provider_order_id character varying(60),
    provider_shipment_id character varying(60),
    awb_no character varying(60),
    status character varying(30) DEFAULT 'created'::character varying NOT NULL,
    declared_value numeric(14,2) DEFAULT 0 NOT NULL,
    insured boolean DEFAULT false NOT NULL,
    weight_g numeric(12,3),
    dimensions jsonb,
    ship_to jsonb,
    pickup_at timestamp with time zone,
    delivered_at timestamp with time zone,
    tracking jsonb DEFAULT '[]'::jsonb NOT NULL,
    label_file_id uuid,
    external_ref character varying(100),
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shipments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shipments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shipments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shipments_id_seq OWNED BY public.shipments.id;


--
-- Name: shop_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_settings (
    id integer NOT NULL,
    shop_name character varying(200) DEFAULT 'My Jewellery Shop'::character varying NOT NULL,
    owner_name character varying(200),
    address text,
    city character varying(100),
    state character varying(100),
    pincode character varying(10),
    phone character varying(20),
    phone2 character varying(20),
    email character varying(200),
    gst_no character varying(30),
    pan_no character varying(20),
    logo_url text,
    currency character varying(10) DEFAULT 'INR'::character varying,
    gold_gst_rate numeric(5,2) DEFAULT 3.00,
    silver_gst_rate numeric(5,2) DEFAULT 3.00,
    making_gst_rate numeric(5,2) DEFAULT 5.00,
    gst_enabled boolean DEFAULT true,
    financial_year_start character varying(5) DEFAULT '04-01'::character varying,
    invoice_prefix character varying(20) DEFAULT 'INV'::character varying,
    loan_prefix character varying(20) DEFAULT 'LOAN'::character varying,
    repair_prefix character varying(20) DEFAULT 'REP'::character varying,
    booking_prefix character varying(20) DEFAULT 'BKG'::character varying,
    updated_at timestamp with time zone DEFAULT now(),
    singleton_key character varying(10) DEFAULT 'main'::character varying,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    shop_code character varying(8)
);


--
-- Name: shop_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shop_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shop_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shop_settings_id_seq OWNED BY public.shop_settings.id;


--
-- Name: shop_settings_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_settings_v2 (
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    grp character varying(40) NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    row_version integer DEFAULT 1 NOT NULL,
    updated_by integer,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: stock_audit_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_audit_counts (
    id bigint NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    audit_id integer NOT NULL,
    category character varying(60) NOT NULL,
    metal character varying(50) DEFAULT ''::character varying NOT NULL,
    pcs integer,
    gross numeric(12,3),
    net numeric(12,3),
    notes text,
    counted_by integer,
    counted_at timestamp with time zone DEFAULT now() NOT NULL,
    superseded_at timestamp with time zone,
    superseded_by integer,
    sys_pcs integer,
    sys_gross numeric(12,3),
    sys_net numeric(12,3),
    CONSTRAINT stock_audit_counts_pcs_check CHECK ((pcs >= 0))
);


--
-- Name: stock_audit_counts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_audit_counts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_audit_counts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_audit_counts_id_seq OWNED BY public.stock_audit_counts.id;


--
-- Name: stock_audit_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_audit_lines (
    id bigint NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    audit_id integer NOT NULL,
    item_id integer NOT NULL,
    item_code character varying(60),
    name character varying(200),
    category character varying(60),
    metal_type character varying(50),
    purity character varying(30),
    huid character varying(20),
    gross_weight numeric(12,3) DEFAULT 0 NOT NULL,
    net_weight numeric(12,3) DEFAULT 0 NOT NULL,
    unit_value numeric(14,2) DEFAULT 0 NOT NULL,
    system_qty integer DEFAULT 0 NOT NULL,
    counted_qty integer DEFAULT 0 NOT NULL,
    status character varying(20) NOT NULL
);


--
-- Name: stock_audit_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_audit_lines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_audit_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_audit_lines_id_seq OWNED BY public.stock_audit_lines.id;


--
-- Name: stock_audit_scans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_audit_scans (
    id bigint NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    audit_id integer NOT NULL,
    code character varying(200) NOT NULL,
    item_id integer,
    qty integer DEFAULT 1 NOT NULL,
    result character varying(20) NOT NULL,
    sold_ref character varying(60),
    scanned_by integer,
    scanned_at timestamp with time zone DEFAULT now() NOT NULL,
    voided_at timestamp with time zone,
    voided_by integer,
    source character varying(10) DEFAULT 'scan'::character varying NOT NULL
);


--
-- Name: stock_audit_scans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_audit_scans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_audit_scans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_audit_scans_id_seq OWNED BY public.stock_audit_scans.id;


--
-- Name: stock_audits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_audits (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    audit_no character varying(30) NOT NULL,
    name character varying(150) NOT NULL,
    categories text[],
    metal_types text[],
    notes text,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    started_by integer,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_by integer,
    completed_at timestamp with time zone,
    cancel_reason text,
    summary jsonb,
    row_version integer DEFAULT 1 NOT NULL,
    method character varying(10) DEFAULT 'scan'::character varying NOT NULL,
    blind boolean DEFAULT false NOT NULL
);


--
-- Name: stock_audits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_audits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_audits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_audits_id_seq OWNED BY public.stock_audits.id;


--
-- Name: supplier_bill_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_bill_lines (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    bill_id integer NOT NULL,
    grn_line_id integer,
    description character varying(300) NOT NULL,
    hsn character varying(10),
    qty integer DEFAULT 1 NOT NULL,
    net_weight numeric(12,3) DEFAULT 0 NOT NULL,
    stone_weight numeric(12,3) DEFAULT 0 NOT NULL,
    rate_basis character varying(10),
    rate numeric(14,2) DEFAULT 0 NOT NULL,
    po_rate numeric(14,2),
    expected_amount numeric(14,2),
    taxable numeric(14,2) DEFAULT 0 NOT NULL,
    gst_pct numeric(7,3) DEFAULT 0 NOT NULL,
    po_gst_pct numeric(7,3),
    gst_amount numeric(14,2) DEFAULT 0 NOT NULL,
    line_total numeric(14,2) DEFAULT 0 NOT NULL,
    variance numeric(14,2) DEFAULT 0 NOT NULL,
    variance_flag character varying(40)
);


--
-- Name: supplier_bill_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supplier_bill_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: supplier_bill_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supplier_bill_lines_id_seq OWNED BY public.supplier_bill_lines.id;


--
-- Name: supplier_bills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_bills (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    bill_no character varying(30) NOT NULL,
    supplier_id integer NOT NULL,
    supplier_invoice_no character varying(60) NOT NULL,
    supplier_invoice_date date NOT NULL,
    bill_date date DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata'::text))::date NOT NULL,
    tax_mode character varying(10) DEFAULT 'intra'::character varying NOT NULL,
    taxable numeric(14,2) DEFAULT 0 NOT NULL,
    cgst numeric(14,2) DEFAULT 0 NOT NULL,
    sgst numeric(14,2) DEFAULT 0 NOT NULL,
    igst numeric(14,2) DEFAULT 0 NOT NULL,
    other_charges numeric(14,2) DEFAULT 0 NOT NULL,
    round_off numeric(14,2) DEFAULT 0 NOT NULL,
    printed_total numeric(14,2),
    total numeric(14,2) DEFAULT 0 NOT NULL,
    itc_eligible character varying(10) DEFAULT 'yes'::character varying NOT NULL,
    due_date date,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    pay_status character varying(20) DEFAULT 'unpaid'::character varying NOT NULL,
    paid_amount numeric(14,2) DEFAULT 0 NOT NULL,
    duplicate_override text,
    has_variance boolean DEFAULT false NOT NULL,
    notes text,
    created_by integer,
    posted_by integer,
    posted_at timestamp with time zone,
    cancelled_by integer,
    cancelled_at timestamp with time zone,
    cancel_reason text,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT supplier_bills_itc_eligible_check CHECK (((itc_eligible)::text = ANY ((ARRAY['yes'::character varying, 'no'::character varying, 'partial'::character varying])::text[]))),
    CONSTRAINT supplier_bills_pay_status_check CHECK (((pay_status)::text = ANY ((ARRAY['unpaid'::character varying, 'partial'::character varying, 'paid'::character varying])::text[]))),
    CONSTRAINT supplier_bills_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'posted'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT supplier_bills_tax_mode_check CHECK (((tax_mode)::text = ANY ((ARRAY['intra'::character varying, 'inter'::character varying, 'none'::character varying])::text[])))
);


--
-- Name: supplier_bills_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supplier_bills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: supplier_bills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supplier_bills_id_seq OWNED BY public.supplier_bills.id;


--
-- Name: supplier_item_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_item_rates (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    supplier_item_id integer NOT NULL,
    rate_basis character varying(10) NOT NULL,
    rate numeric(14,2) NOT NULL,
    effective_from date NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: supplier_item_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supplier_item_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: supplier_item_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supplier_item_rates_id_seq OWNED BY public.supplier_item_rates.id;


--
-- Name: supplier_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_items (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    supplier_id integer NOT NULL,
    supplier_item_code character varying(60),
    sku character varying(60),
    design_no character varying(60),
    brand character varying(100),
    name character varying(300) NOT NULL,
    metal_type character varying(30),
    purity character varying(20),
    hsn character varying(10),
    gross_weight numeric(12,3) DEFAULT 0 NOT NULL,
    net_weight numeric(12,3) DEFAULT 0 NOT NULL,
    stone_weight numeric(12,3) DEFAULT 0 NOT NULL,
    rate_basis character varying(10) DEFAULT 'per_gram'::character varying NOT NULL,
    current_rate numeric(14,2) DEFAULT 0 NOT NULL,
    gst_pct numeric(7,3) DEFAULT 3 NOT NULL,
    stones jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    item_type character varying(100),
    category character varying(30),
    CONSTRAINT supplier_items_rate_basis_check CHECK (((rate_basis)::text = ANY ((ARRAY['per_gram'::character varying, 'per_ct'::character varying, 'fixed'::character varying])::text[])))
);


--
-- Name: supplier_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supplier_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: supplier_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supplier_items_id_seq OWNED BY public.supplier_items.id;


--
-- Name: supplier_payment_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_payment_allocations (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    payment_id integer NOT NULL,
    bill_id integer NOT NULL,
    amount numeric(14,2) NOT NULL,
    voided boolean DEFAULT false NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT supplier_payment_allocations_amount_check CHECK ((amount > (0)::numeric))
);


--
-- Name: supplier_payment_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supplier_payment_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: supplier_payment_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supplier_payment_allocations_id_seq OWNED BY public.supplier_payment_allocations.id;


--
-- Name: supplier_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_payments (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    payment_no character varying(30) NOT NULL,
    supplier_id integer NOT NULL,
    payment_date date DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata'::text))::date NOT NULL,
    amount numeric(14,2) NOT NULL,
    payment_mode character varying(30) NOT NULL,
    utr character varying(100),
    notes text,
    unallocated numeric(14,2) DEFAULT 0 NOT NULL,
    outflow_id integer,
    status character varying(10) DEFAULT 'active'::character varying NOT NULL,
    void_reason text,
    voided_by integer,
    voided_at timestamp with time zone,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    opening_applied numeric(14,2) DEFAULT 0 NOT NULL,
    money_amount numeric(14,2),
    metal_type character varying(10),
    metal_fine_qty numeric(12,3),
    metal_purity character varying(20),
    metal_rate_10g numeric(14,2),
    metal_amount numeric(14,2),
    CONSTRAINT supplier_payments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT supplier_payments_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'voided'::character varying])::text[])))
);


--
-- Name: supplier_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supplier_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: supplier_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supplier_payments_id_seq OWNED BY public.supplier_payments.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    supplier_code character varying(20),
    name character varying(200) NOT NULL,
    phone character varying(20),
    email character varying(200),
    address text,
    gst_no character varying(30),
    pan_no character varying(20),
    credit_days integer DEFAULT 30,
    opening_balance numeric(14,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    supplier_type character varying(30) DEFAULT 'manufacturer'::character varying NOT NULL,
    gst_reg_type character varying(20) DEFAULT 'regular'::character varying NOT NULL,
    state_code character varying(2),
    contact_person character varying(200),
    phone2 character varying(20),
    city character varying(100),
    state character varying(100),
    pincode character varying(10),
    payment_terms character varying(200),
    bank_name character varying(100),
    bank_account character varying(30),
    ifsc character varying(15),
    notes text,
    row_version integer DEFAULT 1 NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    created_by integer
);


--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_code character varying(30) NOT NULL,
    legal_name character varying(200),
    display_name character varying(200) NOT NULL,
    subdomain character varying(63),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tenants_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying])::text[])))
);


--
-- Name: user_permission_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permission_overrides (
    user_id integer NOT NULL,
    permission_key character varying(60) NOT NULL,
    effect character varying(5) NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    CONSTRAINT user_permission_overrides_effect_check CHECK (((effect)::text = ANY ((ARRAY['allow'::character varying, 'deny'::character varying])::text[])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    email character varying(200) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'staff'::character varying,
    phone character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    username character varying(60),
    is_owner boolean DEFAULT false NOT NULL,
    must_change_password boolean DEFAULT false NOT NULL,
    failed_logins integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    last_login_at timestamp with time zone,
    password_changed_at timestamp with time zone,
    pw_changed_by integer,
    recovery_hash character varying(255),
    disabled_reason text,
    disabled_at timestamp with time zone,
    disabled_by integer,
    row_version integer DEFAULT 1 NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying, 'accountant'::character varying, 'staff'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: webhook_deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_deliveries (
    id bigint NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    subscription_id integer NOT NULL,
    event_id uuid NOT NULL,
    event_type character varying(60) NOT NULL,
    payload jsonb NOT NULL,
    attempt integer DEFAULT 0 NOT NULL,
    status character varying(10) DEFAULT 'pending'::character varying NOT NULL,
    response_code integer,
    response_body text,
    next_retry_at timestamp with time zone DEFAULT now() NOT NULL,
    delivered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT webhook_deliveries_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'delivered'::character varying, 'failed'::character varying, 'dead'::character varying])::text[])))
);


--
-- Name: webhook_deliveries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.webhook_deliveries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: webhook_deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.webhook_deliveries_id_seq OWNED BY public.webhook_deliveries.id;


--
-- Name: webhook_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_subscriptions (
    id integer NOT NULL,
    tenant_id uuid DEFAULT public.kj_current_tenant() NOT NULL,
    url character varying(500) NOT NULL,
    events text[] NOT NULL,
    secret_enc text NOT NULL,
    description character varying(200),
    status character varying(10) DEFAULT 'active'::character varying NOT NULL,
    failure_count integer DEFAULT 0 NOT NULL,
    disabled_reason text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT webhook_subscriptions_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'disabled'::character varying])::text[])))
);


--
-- Name: webhook_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.webhook_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: webhook_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.webhook_subscriptions_id_seq OWNED BY public.webhook_subscriptions.id;


--
-- Name: advance_reversals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advance_reversals ALTER COLUMN id SET DEFAULT nextval('public.advance_reversals_id_seq'::regclass);


--
-- Name: api_clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_clients ALTER COLUMN id SET DEFAULT nextval('public.api_clients_id_seq'::regclass);


--
-- Name: api_keys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys ALTER COLUMN id SET DEFAULT nextval('public.api_keys_id_seq'::regclass);


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Name: booking_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_items ALTER COLUMN id SET DEFAULT nextval('public.booking_items_id_seq'::regclass);


--
-- Name: booking_metal_deposits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_metal_deposits ALTER COLUMN id SET DEFAULT nextval('public.booking_metal_deposits_id_seq'::regclass);


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: buyback_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyback_items ALTER COLUMN id SET DEFAULT nextval('public.buyback_items_id_seq'::regclass);


--
-- Name: buybacks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buybacks ALTER COLUMN id SET DEFAULT nextval('public.buybacks_id_seq'::regclass);


--
-- Name: cancellation_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_items ALTER COLUMN id SET DEFAULT nextval('public.cancellation_items_id_seq'::regclass);


--
-- Name: cancellations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellations ALTER COLUMN id SET DEFAULT nextval('public.cancellations_id_seq'::regclass);


--
-- Name: cash_outflows id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_outflows ALTER COLUMN id SET DEFAULT nextval('public.cash_outflows_id_seq'::regclass);


--
-- Name: credit_memos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_memos ALTER COLUMN id SET DEFAULT nextval('public.credit_memos_id_seq'::regclass);


--
-- Name: customer_credits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_credits ALTER COLUMN id SET DEFAULT nextval('public.customer_credits_id_seq'::regclass);


--
-- Name: customer_visits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_visits ALTER COLUMN id SET DEFAULT nextval('public.customer_visits_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: daily_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_rates ALTER COLUMN id SET DEFAULT nextval('public.daily_rates_id_seq'::regclass);


--
-- Name: deposit_payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposit_payments ALTER COLUMN id SET DEFAULT nextval('public.deposit_payments_id_seq'::regclass);


--
-- Name: deposits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits ALTER COLUMN id SET DEFAULT nextval('public.deposits_id_seq'::regclass);


--
-- Name: document_links id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_links ALTER COLUMN id SET DEFAULT nextval('public.document_links_id_seq'::regclass);


--
-- Name: domain_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.domain_events ALTER COLUMN id SET DEFAULT nextval('public.domain_events_id_seq'::regclass);


--
-- Name: error_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs ALTER COLUMN id SET DEFAULT nextval('public.error_logs_id_seq'::regclass);


--
-- Name: gateway_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gateway_events ALTER COLUMN id SET DEFAULT nextval('public.gateway_events_id_seq'::regclass);


--
-- Name: goods_receipt_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipt_lines ALTER COLUMN id SET DEFAULT nextval('public.goods_receipt_lines_id_seq'::regclass);


--
-- Name: goods_receipt_tags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipt_tags ALTER COLUMN id SET DEFAULT nextval('public.goods_receipt_tags_id_seq'::regclass);


--
-- Name: goods_receipts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipts ALTER COLUMN id SET DEFAULT nextval('public.goods_receipts_id_seq'::regclass);


--
-- Name: gst_2b_imports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gst_2b_imports ALTER COLUMN id SET DEFAULT nextval('public.gst_2b_imports_id_seq'::regclass);


--
-- Name: gst_2b_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gst_2b_lines ALTER COLUMN id SET DEFAULT nextval('public.gst_2b_lines_id_seq'::regclass);


--
-- Name: inventory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory ALTER COLUMN id SET DEFAULT nextval('public.inventory_id_seq'::regclass);


--
-- Name: inventory_stones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_stones ALTER COLUMN id SET DEFAULT nextval('public.inventory_stones_id_seq'::regclass);


--
-- Name: inventory_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);


--
-- Name: item_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_images ALTER COLUMN id SET DEFAULT nextval('public.item_images_id_seq'::regclass);


--
-- Name: license_keys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_keys ALTER COLUMN id SET DEFAULT nextval('public.license_keys_id_seq'::regclass);


--
-- Name: loan_emi_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_emi_records ALTER COLUMN id SET DEFAULT nextval('public.loan_emi_records_id_seq'::regclass);


--
-- Name: loan_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_items ALTER COLUMN id SET DEFAULT nextval('public.loan_items_id_seq'::regclass);


--
-- Name: loan_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_transactions ALTER COLUMN id SET DEFAULT nextval('public.loan_transactions_id_seq'::regclass);


--
-- Name: loans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans ALTER COLUMN id SET DEFAULT nextval('public.loans_id_seq'::regclass);


--
-- Name: metal_stock_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metal_stock_history ALTER COLUMN id SET DEFAULT nextval('public.metal_stock_history_id_seq'::regclass);


--
-- Name: metal_stock_movements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metal_stock_movements ALTER COLUMN id SET DEFAULT nextval('public.metal_stock_movements_id_seq'::regclass);


--
-- Name: old_gold_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.old_gold_items ALTER COLUMN id SET DEFAULT nextval('public.old_gold_items_id_seq'::regclass);


--
-- Name: old_gold_payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.old_gold_payments ALTER COLUMN id SET DEFAULT nextval('public.old_gold_payments_id_seq'::regclass);


--
-- Name: old_gold_purchases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.old_gold_purchases ALTER COLUMN id SET DEFAULT nextval('public.old_gold_purchases_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: payment_allocations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_allocations ALTER COLUMN id SET DEFAULT nextval('public.payment_allocations_id_seq'::regclass);


--
-- Name: payment_links id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_links ALTER COLUMN id SET DEFAULT nextval('public.payment_links_id_seq'::regclass);


--
-- Name: payment_receipts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_receipts ALTER COLUMN id SET DEFAULT nextval('public.payment_receipts_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: platform_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_users ALTER COLUMN id SET DEFAULT nextval('public.platform_users_id_seq'::regclass);


--
-- Name: purchase_order_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_lines ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_lines_id_seq'::regclass);


--
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- Name: refined_metal_ledger id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refined_metal_ledger ALTER COLUMN id SET DEFAULT nextval('public.refined_metal_ledger_id_seq'::regclass);


--
-- Name: refinery_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refinery_jobs ALTER COLUMN id SET DEFAULT nextval('public.refinery_jobs_id_seq'::regclass);


--
-- Name: register_change_flags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_change_flags ALTER COLUMN id SET DEFAULT nextval('public.register_change_flags_id_seq'::regclass);


--
-- Name: register_counters id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_counters ALTER COLUMN id SET DEFAULT nextval('public.register_counters_id_seq'::regclass);


--
-- Name: register_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_entries ALTER COLUMN id SET DEFAULT nextval('public.register_entries_id_seq'::regclass);


--
-- Name: register_reopen_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_reopen_log ALTER COLUMN id SET DEFAULT nextval('public.register_reopen_log_id_seq'::regclass);


--
-- Name: register_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_sessions ALTER COLUMN id SET DEFAULT nextval('public.register_sessions_id_seq'::regclass);


--
-- Name: repair_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_items ALTER COLUMN id SET DEFAULT nextval('public.repair_items_id_seq'::regclass);


--
-- Name: repairs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repairs ALTER COLUMN id SET DEFAULT nextval('public.repairs_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: shipments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments ALTER COLUMN id SET DEFAULT nextval('public.shipments_id_seq'::regclass);


--
-- Name: shop_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_settings ALTER COLUMN id SET DEFAULT nextval('public.shop_settings_id_seq'::regclass);


--
-- Name: stock_audit_counts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audit_counts ALTER COLUMN id SET DEFAULT nextval('public.stock_audit_counts_id_seq'::regclass);


--
-- Name: stock_audit_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audit_lines ALTER COLUMN id SET DEFAULT nextval('public.stock_audit_lines_id_seq'::regclass);


--
-- Name: stock_audit_scans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audit_scans ALTER COLUMN id SET DEFAULT nextval('public.stock_audit_scans_id_seq'::regclass);


--
-- Name: stock_audits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audits ALTER COLUMN id SET DEFAULT nextval('public.stock_audits_id_seq'::regclass);


--
-- Name: supplier_bill_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_bill_lines ALTER COLUMN id SET DEFAULT nextval('public.supplier_bill_lines_id_seq'::regclass);


--
-- Name: supplier_bills id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_bills ALTER COLUMN id SET DEFAULT nextval('public.supplier_bills_id_seq'::regclass);


--
-- Name: supplier_item_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_item_rates ALTER COLUMN id SET DEFAULT nextval('public.supplier_item_rates_id_seq'::regclass);


--
-- Name: supplier_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_items ALTER COLUMN id SET DEFAULT nextval('public.supplier_items_id_seq'::regclass);


--
-- Name: supplier_payment_allocations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payment_allocations ALTER COLUMN id SET DEFAULT nextval('public.supplier_payment_allocations_id_seq'::regclass);


--
-- Name: supplier_payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payments ALTER COLUMN id SET DEFAULT nextval('public.supplier_payments_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: webhook_deliveries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_deliveries ALTER COLUMN id SET DEFAULT nextval('public.webhook_deliveries_id_seq'::regclass);


--
-- Name: webhook_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.webhook_subscriptions_id_seq'::regclass);


--
-- Data for Name: advance_reversals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.advance_reversals (id, tenant_id, allocation_id, order_id, order_no, order_item_id, item_name, booking_id, deposit_id, metal_type, weight, rate_per_10g, amount, payment_no, applied_at, reason, source, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: api_clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.api_clients (id, tenant_id, name, client_id, secret_hash, scopes, ip_allowlist, rate_per_min, status, created_by, created_at, last_used_at, revoked_at, revoked_by) FROM stdin;
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.api_keys (id, tenant_id, api_client_id, key_prefix, key_hash, expires_at, revoked_at, last_used_at, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (id, tenant_id, at, actor_type, actor_id, actor_name, action, entity, entity_id, ref_no, details, reason, ip, user_agent, request_id) FROM stdin;
1	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:13:59.108294+00	user	1	Admin	LOGIN_OK	user	1	\N	{"session": "bff3f72a-7081-4661-af02-0d784db90299"}	\N	\N	\N	req_2afec14ed6d16cac
2	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:15:54.270624+00	user	1	Admin	PASSWORD_CHANGED	user	1	\N	{}	\N	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	req_61eab1a14d4eb5d0
3	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:19:28.865994+00	user	1	Admin	LICENSE_KEY_ADDED	license	1	\N	{"key": "KRY-TD•••••••••••••••-P228S", "status": "active", "expiresOn": "2026-12-15"}	\N	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	req_5693d171b92b0124
4	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:19:28.865994+00	user	1	Admin	LICENSE_STATUS_CHANGED	license	\N	\N	{"to": "valid", "from": "missing", "reason": "key_entered"}	\N	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	req_5693d171b92b0124
5	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:23:19.399265+00	user	1	Admin	SETTINGS_CHANGED	settings	theme	\N	{"changes": {"gold": {"to": "#c5a46d", "from": null}, "mode": {"to": "light", "from": null}, "accent": {"to": "#c5a46d", "from": null}, "preset": {"to": "classic_light", "from": null}, "radius": {"to": "rounded", "from": null}, "density": {"to": "comfortable", "from": null}, "primary": {"to": "#237a57", "from": null}, "fontScale": {"to": 1, "from": null}, "navLayout": {"to": "sidebar", "from": null}, "secondary": {"to": "#202522", "from": null}, "sidebarBg": {"to": "#ffffff", "from": null}, "fontFamily": {"to": "inter", "from": null}, "tableZebra": {"to": false, "from": null}, "buttonStyle": {"to": "solid", "from": null}, "sidebarStyle": {"to": "light", "from": null}, "dashboardTiles": {"to": ["today_sales", "today_collections", "outstanding", "open_repairs", "active_loans", "low_stock"], "from": null}, "sidebarCollapsed": {"to": false, "from": null}}}	\N	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	req_4a7d4ebd97e366ef
6	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:25:56.396094+00	user	1	Admin	USER_CREATED	user	2	\N	{"name": "Sandeep Shah", "email": "sandeepshah2000@gmail.com", "roles": ["Cashier", "Sales"]}	\N	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	req_70cb8e8241fd7cbc
7	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:27:00.180932+00	user	1	Admin	USER_CREATED	user	3	\N	{"name": "Rahul Jain", "email": "sbjrahul01@gmail.com", "roles": ["Viewer", "Accountant"]}	\N	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	req_91760273e7f7fa80
8	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:33:22.579227+00	user	1	Admin	INVENTORY_IMPORTED	inventory	\N	\N	{"items": 1, "pieces": 3, "stones": 0}	\N	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	req_97840958095299cb
9	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:35:14.795266+00	user	1	Admin	LOGIN_OK	user	1	\N	{"session": "a480c1b0-29c2-4c44-8f28-afa847fc40eb"}	\N	\N	\N	req_4d84235e13b3282b
10	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:37:37.992991+00	user	1	Admin	REGISTER_OPENED	register	1	REG-2026-00001	{"counter": "MAIN", "opening": "50000.00"}	\N	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	req_8e2884dd11b02f9d
11	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:38:23.936959+00	user	1	Admin	REGISTER_ENTRY	register	1	RCE-2026-00001	{"type": "expense", "amount": "30.00", "category": "Tea / refreshments"}	\N	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	req_c3b3657959403c64
12	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:38:54.578243+00	user	1	Admin	REGISTER_CLOSING	register	1	REG-2026-00001	{}	\N	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	req_8a26ec574d5da53b
13	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:42:17.268321+00	user	1	Admin	LOGIN_OK	user	1	\N	{"session": "de401cdb-fc17-47ba-968b-dd0f008a5bcc"}	\N	\N	\N	req_35f04e601a7558db
\.


--
-- Data for Name: booking_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booking_items (id, booking_id, description, category, metal_type, purity, weight, design_note, quantity, estimated_amount, inventory_id, delivery_date, delivered_qty, cancelled_qty, item_status, rate_per_unit, booking_rate, delivery_rate, balance_amount, tenant_id, booking_weight, balance_weight) FROM stdin;
\.


--
-- Data for Name: booking_metal_deposits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booking_metal_deposits (id, booking_id, metal_type, deposit_date, rate_per_10g, amount, grams_locked, notes, created_by, created_at, allocated_weight, remaining_weight, allocation_status, gst_pct, gst_amount, refunded_weight, refunded_amount, tenant_id) FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, booking_no, customer_id, customer_name, phone, occasion, total_estimate, advance_paid, balance_due, booking_date, delivery_date, status, cancellation_reason, refund_amount, notes, created_by, created_at, updated_at, gold_grams_locked, silver_grams_locked, total_deposits, cancellation_id, tenant_id) FROM stdin;
\.


--
-- Data for Name: buyback_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.buyback_items (id, tenant_id, buyback_id, order_item_id, item_id, item_code, description, metal_type, purity, qty, gross_weight, stone_weight, net_weight, rate_per_10g, metal_value, refining_pct, refining_amount, diamond_value, diamond_pct, gem_value, gem_pct, stone_value, other_deduction, net_amount, stock_action) FROM stdin;
\.


--
-- Data for Name: buybacks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.buybacks (id, tenant_id, buyback_no, buyback_date, customer_id, customer_name, order_id, order_no, invoice_date, gross_value, total_deduction, net_amount, refund_amount, credit_amount, refining_pct, diamond_pct, gem_pct, status, notes, cancel_reason, cancelled_at, cancelled_by, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: cancellation_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cancellation_items (id, cancellation_id, order_item_id, item_code, item_name, quantity, unit_price, total_amount, gst_amount, inventory_id, tenant_id) FROM stdin;
\.


--
-- Data for Name: cancellations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cancellations (id, cancellation_no, reference_type, reference_id, reference_no, customer_id, customer_name, reason, total_amount, paid_amount, deduction_amount, refund_amount, refund_mode, refund_date, status, approved_by, notes, created_by, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: cash_outflows; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cash_outflows (id, tenant_id, outflow_no, category, amount, payment_mode, outflow_date, reference_no, notes, source_ref, customer_id, buyback_id, supplier_id, supplier_payment_id, loan_id, old_gold_purchase_id, register_session_id, voided, void_reason, voided_by, voided_at, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: credit_memos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.credit_memos (id, credit_memo_no, cancellation_id, order_id, customer_id, customer_name, original_amount, refund_amount, deduction_amount, deduction_reason, refund_mode, refund_status, refund_date, notes, created_by, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: customer_credits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_credits (id, tenant_id, customer_id, txn_date, amount, source, buyback_id, payment_id, order_id, ref_no, notes, voided, void_reason, voided_by, voided_at, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: customer_visits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_visits (id, tenant_id, customer_id, visit_date, purpose, notes, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, customer_code, name, phone, phone2, email, street1, street2, city, state, pincode, aadhar_no, pan_no, gst_no, dob, anniversary, father_name, father_mobile, mother_name, mother_mobile, brother_name, brother_mobile, son_name, son_mobile, daughter_name, daughter_mobile, customer_type, credit_limit, opening_balance, total_purchased, loyalty_points, notes, is_active, created_by, created_at, updated_at, tenant_id, form60, last_visit_date, state_code, guarantor_name, guarantor_mobile, external_ref) FROM stdin;
\.


--
-- Data for Name: daily_rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_rates (id, rate_date, gold_22k, gold_24k, gold_18k, gold_14k, silver, platinum, dollar_rate, notes, created_by, created_at, tenant_id, silver_per_10g) FROM stdin;
\.


--
-- Data for Name: deposit_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deposit_payments (id, deposit_id, month_no, payment_date, amount, payment_mode, status, tenant_id, payment_id, voided) FROM stdin;
\.


--
-- Data for Name: deposits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deposits (id, deposit_no, customer_id, scheme_type, scheme_name, monthly_amount, tenure_months, start_date, end_date, interest_rate, metal_weight, purity, total_paid, bonus_amount, maturity_value, status, notes, created_by, created_at, tenant_id, bonus_instalments, redeemed_at, redeemed_value, redeemed_bonus, redeemed_by, close_reason) FROM stdin;
\.


--
-- Data for Name: doc_counters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.doc_counters (tenant_id, series, period, last_no, updated_at) FROM stdin;
788195d6-463b-4f94-bfeb-41aad2c84f5e	register_sessions:REG-2026-		1	2026-11-15 11:37:37.992991+00
788195d6-463b-4f94-bfeb-41aad2c84f5e	register_entries:RCE-2026-		1	2026-11-15 11:38:23.936959+00
\.


--
-- Data for Name: document_links; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_links (id, tenant_id, entity_type, entity_id, file_id, doc_type, note, uploaded_by, uploaded_at, removed_at, removed_by, remove_reason) FROM stdin;
\.


--
-- Data for Name: domain_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.domain_events (id, tenant_id, event_id, event_type, payload, created_at, dispatched_at) FROM stdin;
1	788195d6-463b-4f94-bfeb-41aad2c84f5e	767a6df5-5228-49f7-9592-1f537bec499a	inventory.item.created	{"id": 1, "code": "SBJCH-01", "name": "Gold Chain 22K Rope", "quantity": 0, "externalRef": null}	2026-11-15 11:33:22.579227+00	2026-11-15 11:33:25.19702+00
2	788195d6-463b-4f94-bfeb-41aad2c84f5e	ef6801ad-ff1e-4099-9624-bdc7694a85b8	inventory.item.updated	{"id": 1, "code": "SBJCH-01", "name": "Gold Chain 22K Rope", "quantity": 3, "externalRef": null}	2026-11-15 11:33:22.579227+00	2026-11-15 11:33:25.19702+00
\.


--
-- Data for Name: error_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.error_logs (id, occurred_at, source, severity, tenant_id, user_id, request_id, route, method, http_status, error_code, message, stack, context, app_version, user_agent, ip, fingerprint, count, first_seen_at, last_seen_at, status, resolved_by, resolved_at) FROM stdin;
\.


--
-- Data for Name: file_blobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.file_blobs (file_id, variant, tenant_id, mime_type, data) FROM stdin;
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.files (id, tenant_id, storage, storage_key, original_name, mime_type, size_bytes, sha256, width, height, purpose, uploaded_by, uploaded_at, deleted_at, deleted_by, scan_status) FROM stdin;
\.


--
-- Data for Name: gateway_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gateway_events (id, tenant_id, provider, event_id, event_type, payload, received_at, processed, result) FROM stdin;
\.


--
-- Data for Name: goods_receipt_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.goods_receipt_lines (id, tenant_id, grn_id, line_no, po_line_id, description, metal_type, purity, hsn, category, received_qty, accepted_qty, rejected_qty, reject_reason, gross_weight, net_weight, stone_weight, expected_net, tolerance_ok, cost_per_piece, rate_basis, rate, gst_pct, stock_mode, item_id, prev_item_state, billed_qty, stones, item_type, retail_margin_pct, wholesale_margin_pct) FROM stdin;
\.


--
-- Data for Name: goods_receipt_tags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.goods_receipt_tags (id, tenant_id, grn_line_id, item_id, item_code) FROM stdin;
\.


--
-- Data for Name: goods_receipts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.goods_receipts (id, tenant_id, grn_no, supplier_id, po_id, grn_date, challan_no, status, notes, override_by, override_reason, created_by, created_at, reversed_by, reversed_at, reverse_reason) FROM stdin;
\.


--
-- Data for Name: gst_2b_imports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gst_2b_imports (id, tenant_id, period, file_name, source, line_count, totals, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: gst_2b_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gst_2b_lines (id, tenant_id, import_id, doc_type, note_type, supplier_gstin, supplier_name, doc_no, doc_date, doc_value, pos, reverse_charge, taxable, igst, cgst, sgst, cess, itc_available, filing_period, reason) FROM stdin;
\.


--
-- Data for Name: idempotency_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.idempotency_keys (tenant_id, actor, key, method, path, request_hash, status_code, response, created_at) FROM stdin;
\.


--
-- Data for Name: integration_credentials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integration_credentials (tenant_id, provider, data_enc, updated_by, updated_at) FROM stdin;
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory (id, item_code, name, image_url, category, sub_category, metal_type, purity, huid, gross_weight, net_weight, stone_weight, wastage_pct, making_charge, making_type, stone_charge, mrp, cost_price, hsn, barcode, location, rack, quantity, min_stock, description, is_active, supplier_id, created_at, updated_at, tenant_id, reserved_quantity, sold_quantity, stone_value, external_ref, row_version, item_size, design_no, gender, retail_margin_pct, wholesale_margin_pct, retail_price, wholesale_price, created_by) FROM stdin;
1	SBJCH-01	Gold Chain 22K Rope	\N	gold	Chain	Gold	22K	ZX98YU	12.350	12.350	0.000	6.00	450.00	per_gram	0.00	0.00	0.00	7113	\N	\N	\N	3	1	\N	t	\N	2026-11-15 11:33:22.579227+00	2026-11-15 11:33:22.579227+00	788195d6-463b-4f94-bfeb-41aad2c84f5e	0	0	0.00	\N	1	20 in	\N	Unisex	25.00	12.00	\N	\N	1
\.


--
-- Data for Name: inventory_stones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_stones (id, tenant_id, item_id, line_no, stone_type, shape, clarity, colour, pcs, carat, rate_per_ct, rate_type, amount, stone_group, stone_name, cut, size, setting, weight_g, origin, certificate_no, lab, notes) FROM stdin;
\.


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_transactions (id, tenant_id, item_id, txn_type, reference_no, qty_change, balance_after, posting_ref, supplier_id, notes, txn_at, created_by, reason) FROM stdin;
1	788195d6-463b-4f94-bfeb-41aad2c84f5e	1	stock_in	EXCEL IMPORT	3	3	import:1	\N	\N	2026-11-15 11:33:22.579227+00	1	Opening stock
\.


--
-- Data for Name: item_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.item_images (id, tenant_id, item_id, file_id, sort_order, is_primary, caption, created_by, created_at, removed_at) FROM stdin;
\.


--
-- Data for Name: kj_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kj_migrations (version, name, checksum, applied_at, duration_ms) FROM stdin;
0001	0001_platform_core.sql	aebc46934eb6916d7c207582d5b686c41318f4b46c1fc73ae9266512d911df54	2026-11-15 10:55:11.113385+00	191
0002	0002_license_keys.sql	0b898c86d3d1dc2dc4639f063e968bc3ffc19b900b398499f75218f5c637c4dc	2026-11-15 10:55:11.30705+00	13
0003	0003_w5_sales_core.sql	a37837bcda5c0a7b6521c0615523b2d06151eb1b0b507f40342b58151af031e7	2026-11-15 10:55:11.321155+00	64
0004	0004_w6_operations.sql	b1555f8a241cfbae0a093cef79e46282f9bc08e8e936cae81088cd3e7dbd91d0	2026-11-15 10:55:11.387725+00	51
0005	0005_w7_procurement.sql	f7d4e4b8486bfacce311f3ede10a6f3c430d30a49ced4be5e401896d48ffc642	2026-11-15 10:55:11.440569+00	88
0006	0006_w8_register.sql	21a9da0cc7d21fa3715bfad57be8b852ec25f29b82699b85bb2da3002ca6cf4b	2026-11-15 10:55:11.532384+00	44
0007	0007_w9_integrations.sql	c630a8efd9531e3ea5afc835cf373c89875a4605b6bde5288e8b2fd5f4e9992f	2026-11-15 10:55:11.580558+00	79
0008	0008_v33_catalog_stones.sql	b67d2bf82f5d2a738b039529f9ffb1a298b69449e1c38e03dbb8e44b030e6258	2026-11-15 10:55:11.662184+00	19
0009	0009_v331_cancel_ledger.sql	4d05f5e793cc4ad10c83ffb10d1faebabcee3a70cc96cc0cc7ba2c11714c0d79	2026-11-15 10:55:11.682433+00	10
0010	0010_v332_repair_delivered_date.sql	90c5fcb93947c2dc490f6a8ec42cd5f11d12e1fe92ac846c494ae33330497d61	2026-11-15 10:55:11.695588+00	2
0011	0011_v333_supplier_state.sql	93f9556841cd8dcd15d6281cc676c8c1e8032e2f22b0f62c94a9809eb7fbec55	2026-11-15 10:55:11.69828+00	1
0012	0012_v340_supplier_opening.sql	acf3e6673ddf9d6accb4c6d6eb3d1d0a8e81b5b9f411763951cb294eaa3910be	2026-11-15 10:55:11.699976+00	5
0013	0013_v346_order_totals.sql	71d82d9cce737f45b0855034e6c09625b33b8afa78bd98efbafd1085dc7f9565	2026-11-15 10:55:11.704754+00	2
0014	0014_v348_daily_rates.sql	1ead314552be106a73859aeff70417a73ff91f4ff92961262762bc197f691a5c	2026-11-15 10:55:11.707403+00	2
0015	0015_v3410_doc_no_concurrency.sql	d8c681089ee8b3ed05863de7edbf555ba8cf5e02c443fec310af2249105e67be	2026-11-15 10:55:11.710754+00	1
0016	0016_v3414_scheme_receipts.sql	e7370a0c073166f150805dbcbced1ccc856d2309412a21c011d94b1ca9df0e65	2026-11-15 10:55:11.712221+00	4
0017	0017_v3418_license_api_v1.sql	3d8b357c12d49fb079500f618293ffc7264cb16810123093856ab8f80157777b	2026-11-15 10:55:11.717185+00	1
0018	0018_v3500_refinery_receipts.sql	6cc1a7973c6523a7fe68677cb2ca03e06434b150030f016b39371ed7ada7452b	2026-11-15 10:55:11.719675+00	33
0019	0019_v3600_shop_code.sql	9c26f69efa69c2bf5ab12af2316c8c83e3a96d9e0f638be02431c835049407d5	2026-11-15 10:55:11.753961+00	1
0020	0020_v3700_loans.sql	b68e2b6b6e827106d2cdd621f2352a43fe8282ade0a9c46d895e7d40a6172b3e	2026-11-15 10:55:11.755458+00	20
0021	0021_v3800_procurement_purity.sql	c8846ae6370909571b3dc83fc0ccf39c921b20a748bee221389976428d624d3f	2026-11-15 10:55:11.776677+00	10
0022	0022_v3100_margins.sql	0c252ac6a9924b390f6801aad5e29daf61d9cdc3f0790295bb14678787f5c9da	2026-11-15 10:55:11.786889+00	8
0023	0023_v3100_bookings.sql	3e725d2702fa0ff4638fb15c633d064323f4f0d18d4d8c95590f9722952e2ee6	2026-11-15 10:55:11.795861+00	12
0024	0024_v3110_invoice.sql	84e8d0dae5a2ac6195b4e62a1a24897fe1190c6b2b5ef4c6a539081b77d51d3b	2026-11-15 10:55:11.808898+00	2
0025	0025_v3120_stones.sql	dfed4ede522e1fcf5471a7b66500d27dc5912b46a275bbc94a245cacdb691881	2026-11-15 10:55:11.811149+00	1
0026	0026_v3120_tunch.sql	287ca11960da65189c1d89b24ca6adddb3f72beed3a3c30b32c4343c6f44f3fa	2026-11-15 10:55:11.81332+00	5
0027	0027_v3121_ratelock_totals.sql	c228e29e4484c830e2f02027befad9e10b2fabbdbb2b6dd234a6a5f85b9dce6d	2026-11-15 10:55:11.819132+00	2
0028	0028_v3126_partial_cancel_gst.sql	a4ad477b77b2d289d10517bed68ddb1324c2aa16f479e0a113e7fb7c41aa2210	2026-11-15 10:55:11.822659+00	1
0029	0029_v3126_errorlog_redact.sql	040be9edb6417d6c7f4ba0b1b09d1343799bc7e1e14d02d0a66e84aa1a6654b1	2026-11-15 10:55:11.823912+00	1
0030	0030_v31211_scheme_redeem.sql	75b18df6ff706ca30c83cd4322da760be5dbcb89f0f2043bb4996d65f4393768	2026-11-15 10:55:11.825162+00	1
0031	0031_v31214_stock_verification.sql	0c0cc159125587c33e3277287cead3d2399f2df9cd42a6a6c079fb48f16d6c5c	2026-11-15 10:55:11.826818+00	25
0032	0032_v3140_gstr2b.sql	3429b1e4cb97fe7400da55746a5fdb248105c512a5a6a8f6498df315d22b86a1	2026-11-15 10:55:11.854069+00	23
0033	0033_v3150_verification_counts.sql	71a5e87af7554ac809eed2bc809fb0449273670265535c171a14d90daea5d477	2026-11-15 10:55:11.877831+00	15
\.


--
-- Data for Name: license_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.license_keys (id, tenant_id, license_key, expires_on, server_status, max_users, message, last_verified_at, last_checked_at, last_response, added_by, added_at, source, machine_id, module, remote_state, error_code, customer_name, start_date, activated_at, token, token_expires_at, token_verified) FROM stdin;
1	788195d6-463b-4f94-bfeb-41aad2c84f5e	KRY-TD4G6-CQ6ES-7AQAV-P228S	2026-12-15	found	\N	Licence active.	2026-11-15 11:19:55.702263+00	2026-11-15 11:19:55.702263+00	{"ok": true, "result": "valid", "license": {"state": "active", "module": "jewellery_erp_online", "bound_to": "site:dom-app-developer-495779.run.colosoft.com", "end_date": "2026-12-15", "activated": true, "start_date": "2026-11-15", "license_key": "KRY-TD4G6-CQ6ES-7AQAV-P228S", "module_name": "Jewellery ERP Online", "customer_name": "SB Borana Jewllers", "days_remaining": 30, "activation_date": "2026-11-15T11:19:28.848Z"}, "server_time": "2026-11-15T11:19:55.698Z", "token_expires_at": "2026-12-15T11:19:55.000Z"}	1	2026-11-15 11:19:28.865994+00	kreya_v1	site:dom-app-developer-495779.run.colosoft.com	jewellery_erp_online	active	\N	SB Borana Jewllers	2026-11-15	2026-11-15 11:19:28.848+00	eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImM2NWNjNjYwZmI3NzJlODYifQ.eyJpc3MiOiJrcmV5YWNvbnN1bHRpbmcuY29tIiwic3ViIjoiS1JZLVRENEc2LUNRNkVTLTdBUUFWLVAyMjhTIiwiYXVkIjoiamV3ZWxsZXJ5X2VycF9vbmxpbmUiLCJqdGkiOiI0ZTA4YWJjNC05ODY0LTRhZTUtOTY1Zi1mZmE4YjgyYWRiY2MiLCJpYXQiOjE3OTQ3NDE1OTUsIm5iZiI6MTc5NDY4MTAwMCwiZXhwIjoxNzk3MzMzNTk1LCJtaWQiOiJzaXRlOmRvbS1hcHAtZGV2ZWxvcGVyLTQ5NTc3OS5ydW4uY29sb3NvZnQuY29tIiwiYXBwIjoiS3JleWFKZXdlbDM2MCBXZWIiLCJsaWMiOnsiY3VzdG9tZXJfbmFtZSI6IlNCIEJvcmFuYSBKZXdsbGVycyIsIm1vZHVsZSI6Impld2VsbGVyeV9lcnBfb25saW5lIiwic3RhcnRfZGF0ZSI6IjIwMjYtMTEtMTUiLCJlbmRfZGF0ZSI6IjIwMjYtMTItMTUiLCJhY3RpdmF0aW9uX2RhdGUiOiIyMDI2LTExLTE1VDExOjE5OjI4Ljg0OFoifX0.W2UYWrtoPWZrd_UlCBVMnHs3E4FQQMDKDXsrPXcQCuNd6KnSLkF9fgcbB934McikayfHGFNviEtwvyabfwRq8w	2026-12-15 11:19:55+00	t
\.


--
-- Data for Name: licenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.licenses (id, tenant_id, license_key, plan, max_users, starts_on, expires_on, status, message, last_verified_at, last_checked_at, last_response, grace_days, updated_at) FROM stdin;
a3a635d3-77b6-4cfd-bd32-8de956999522	788195d6-463b-4f94-bfeb-41aad2c84f5e	KRY-TD4G6-CQ6ES-7AQAV-P228S	\N	\N	\N	2026-12-15	valid	Licence active.	2026-11-15 11:19:55.702+00	2026-11-15 11:19:55.702+00	{"ok": true, "result": "valid", "license": {"state": "active", "module": "jewellery_erp_online", "bound_to": "site:dom-app-developer-495779.run.colosoft.com", "end_date": "2026-12-15", "activated": true, "start_date": "2026-11-15", "license_key": "KRY-TD4G6-CQ6ES-7AQAV-P228S", "module_name": "Jewellery ERP Online", "customer_name": "SB Borana Jewllers", "days_remaining": 30, "activation_date": "2026-11-15T11:19:28.848Z"}, "server_time": "2026-11-15T11:19:55.698Z", "token_expires_at": "2026-12-15T11:19:55.000Z"}	0	2026-11-15 11:19:55.707313+00
\.


--
-- Data for Name: loan_emi_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.loan_emi_records (id, loan_id, payment_no, period_start, period_end, days_in_period, principal_for_period, calculated_interest, adjusted_interest, interest_collected, principal_collected, total_collected, adjustment_reason, payment_mode, notes, created_by, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: loan_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.loan_items (id, loan_id, description, purity, gross_weight, net_weight, item_value, metal_type, tenant_id, item_name, item_type, quantity, tag_no, locker_location, item_status, returned_date, returned_by) FROM stdin;
\.


--
-- Data for Name: loan_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.loan_transactions (id, tenant_id, loan_id, txn_date, txn_type, principal_amount, interest_amount, waiver_amount, total_collected, payment_mode, reference_no, notes, payment_id, voided, voided_at, void_reason, legacy_emi_id, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: loans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.loans (id, loan_no, customer_id, customer_name, phone, loan_type, loan_amount, interest_rate, interest_type, tenure_months, issue_date, due_date, total_item_value, total_interest, total_due, paid_amount, balance_due, status, notes, created_by, created_at, updated_at, interest_adjustment, interest_paid, principal_paid, last_interest_date, tenant_id, rate_basis, interest_waived, guarantor_name, guarantor_mobile) FROM stdin;
\.


--
-- Data for Name: metal_stock_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.metal_stock_history (id, tenant_id, movement_id, from_status, to_status, tested_purity, fine_weight, note, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: metal_stock_movements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.metal_stock_movements (id, tenant_id, movement_date, metal, purity, tested_purity, description, gross_weight, net_weight, fine_weight, value, movement_type, source_type, source_id, source_no, posting_ref, status, refiner, notes, row_version, updated_at, created_at, refinery_job_id, status_before_job) FROM stdin;
\.


--
-- Data for Name: old_gold_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.old_gold_items (id, purchase_id, description, metal_type, purity, gross_weight, deductions, net_weight, rate_per_10g, value, touch_purity, notes, created_at, tenant_id, pieces, stone_weight, other_deduction, fine_weight, rate_basis, test_status) FROM stdin;
\.


--
-- Data for Name: old_gold_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.old_gold_payments (id, purchase_id, payment_no, payment_date, amount, payment_mode, reference_no, notes, voided, created_by, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: old_gold_purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.old_gold_purchases (id, purchase_no, customer_id, customer_name, customer_phone, purchase_date, order_id, total_value, cash_paid, adjusted_in_invoice, payment_mode, reference_no, status, notes, created_by, created_at, updated_at, excess_owed, stone_weight_total, tenant_id) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, inventory_id, item_code, item_name, category, purity, huid, gross_weight, net_weight, metal_rate, making_charge, making_type, stone_charge, quantity, unit_price, discount, gst_pct, gst_amount, total_amount, delivered_qty, cancelled_qty, item_status, delivery_date, booking_item_id, booked_weight, balance_weight, booking_rate, delivery_rate, balance_amount, deposit_payment_no, allocation_status, tenant_id, hsn_code, returned_qty, restocked_qty, stones, stone_weight, metal_type, item_type, wastage_pct, cost_price, retail_price, wholesale_price, price_mode, hm_charge, line_discount, making_amount) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, order_no, order_type, customer_id, supplier_id, customer_name, subtotal, discount_amount, discount_pct, taxable_amount, cgst_amount, sgst_amount, igst_amount, total_gst, gst_applied, total_amount, paid_amount, pending_amount, status, notes, created_by, created_at, updated_at, cancellation_id, cancelled_amount, refund_amount, booking_id, old_gold_value, tenant_id, place_of_supply, external_ref) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: payment_allocations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_allocations (id, order_id, order_item_id, booking_id, deposit_id, payment_no, metal_type, booked_weight, booking_rate, booking_amount, item_weight, balance_weight, delivery_rate, balance_amount, adjustment_type, credit_memo_id, status, notes, created_by, created_at, allocated_weight, deposit_remaining_after, tenant_id, rate_benefit, gst_credit) FROM stdin;
\.


--
-- Data for Name: payment_links; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_links (id, tenant_id, provider, order_id, repair_id, amount, provider_link_id, short_url, status, payment_id, gateway_payment_id, created_by, created_at, paid_at) FROM stdin;
\.


--
-- Data for Name: payment_receipts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_receipts (id, tenant_id, payment_id, receipt_no, snapshot, first_printed_at, first_printed_by, last_printed_at, print_count) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, payment_no, order_id, customer_id, loan_id, booking_id, deposit_id, payment_for, amount, payment_mode, reference_no, bank_name, cheque_no, cheque_date, notes, created_by, created_at, repair_id, order_type, credit_memo_id, is_refund, booking_deposit_id, voided, voided_at, voided_by, void_reason, tenant_id, external_ref, gateway_payment_id, register_session_id, loan_txn_id, allocation_id, old_gold_purchase_id, original_amount, metal_type, rate_per_10g, weight_grams) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (key, module, action, description) FROM stdin;
dashboard.view	dashboard	view	Dashboard: view
customers.view	customers	view	Customers: view
customers.create	customers	create	Customers: create
sales.discount_above_limit	sales	discount_above_limit	Sales orders: discount above limit
sales.cancel	sales	cancel	Sales orders: cancel
sales.deliver	sales	deliver	Sales orders: deliver
sales.print	sales	print	Sales orders: print
sales.view_margin	sales	view_margin	Sales orders: view margin
payments.collect	payments	collect	Payments: collect
payments.void	payments	void	Payments: void
payments.view	payments	view	Payments: view
bookings.view	bookings	view	Metal advance booking: view
bookings.create	bookings	create	Metal advance booking: create
bookings.settle	bookings	settle	Metal advance booking: settle
bookings.refund	bookings	refund	Metal advance booking: refund
buyback.view	buyback	view	Returns / Buy-back: view
buyback.create	buyback	create	Returns / Buy-back: create
repairs.view	repairs	view	Repairs: view
repairs.create	repairs	create	Repairs: create
repairs.edit	repairs	edit	Repairs: edit
register.open	register	open	Cash register: open
register.close	register	close	Cash register: close
register.cash_entries	register	cash_entries	Cash register: cash entries
register.reopen	register	reopen	Cash register: reopen
register.approve_difference	register	approve_difference	Cash register: approve difference
register.attach	register	attach	Cash register: attach
reports.sales	reports	sales	Reports: sales
reports.purchase	reports	purchase	Reports: purchase
reports.stock	reports	stock	Reports: stock
reports.margin	reports	margin	Reports: margin
reports.gst	reports	gst	Reports: gst
settings.shop	settings	shop	Settings: shop
settings.gst_invoice	settings	gst_invoice	Settings: gst invoice
settings.theme	settings	theme	Settings: theme
settings.login_page	settings	login_page	Settings: login page
settings.security	settings	security	Settings: security
settings.integrations	settings	integrations	Settings: integrations
settings.tags	settings	tags	Settings: tags
users.view	users	view	Users: view
users.create	users	create	Users: create
users.edit	users	edit	Users: edit
users.disable	users	disable	Users: disable
users.reset_password	users	reset_password	Users: reset password
roles.manage	roles	manage	Roles: manage
integrations.api_keys	integrations	api_keys	Integrations: api keys
integrations.webhooks	integrations	webhooks	Integrations: webhooks
logs.view_audit	logs	view_audit	Logs: view audit
customers.edit	customers	edit	Customers: edit
customers.view_kyc	customers	view_kyc	Customers: view kyc
customers.export	customers	export	Customers: export
rates.view	rates	view	Daily rates: view
rates.edit	rates	edit	Daily rates: edit
inventory.view	inventory	view	Inventory: view
repairs.collect	repairs	collect	Repairs: collect
loans.view	loans	view	Gold / silver loans: view
loans.create	loans	create	Gold / silver loans: create
loans.collect	loans	collect	Gold / silver loans: collect
loans.close	loans	close	Gold / silver loans: close
loans.waive	loans	waive	Gold / silver loans: waive
loans.return_item	loans	return_item	Gold / silver loans: return item
oldgold.view	oldgold	view	Old gold: view
oldgold.create	oldgold	create	Old gold: create
oldgold.settle	oldgold	settle	Old gold: settle
oldgold.undo_exchange	oldgold	undo_exchange	Old gold: undo exchange
metalstock.move	metalstock	move	Old metal stock: move
suppliers.view	suppliers	view	Suppliers: view
suppliers.edit	suppliers	edit	Suppliers: edit
suppliers.activate	suppliers	activate	Suppliers: activate
po.view	po	view	Purchase orders: view
po.create	po	create	Purchase orders: create
po.approve	po	approve	Purchase orders: approve
po.cancel_close	po	cancel_close	Purchase orders: cancel close
po.price_override	po	price_override	Purchase orders: price override
grn.post	grn	post	Goods receipt: post
grn.reverse	grn	reverse	Goods receipt: reverse
bills.view	bills	view	Supplier bills: view
bills.edit	bills	edit	Supplier bills: edit
bills.post	bills	post	Supplier bills: post
bills.cancel	bills	cancel	Supplier bills: cancel
bills.documents	bills	documents	Supplier bills: documents
supplier_payments.create	supplier_payments	create	Supplier payments: create
supplier_payments.void	supplier_payments	void	Supplier payments: void
logs.view_errors	logs	view_errors	Logs: view errors
inventory.create	inventory	create	Inventory: create
inventory.edit	inventory	edit	Inventory: edit
inventory.edit_others	inventory	edit_others	Inventory: edit others
inventory.adjust	inventory	adjust	Inventory: adjust
inventory.import	inventory	import	Inventory: import
inventory.view_cost	inventory	view_cost	Inventory: view cost
inventory.images	inventory	images	Inventory: images
inventory.verify	inventory	verify	Inventory: verify
tags.print	tags	print	Tags: print
sales.view	sales	view	Sales orders: view
sales.create	sales	create	Sales orders: create
sales.edit	sales	edit	Sales orders: edit
\.


--
-- Data for Name: platform_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.platform_users (id, email, name, password_hash, role, is_active, failed_logins, locked_until, last_login_at, created_at) FROM stdin;
\.


--
-- Data for Name: purchase_order_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_order_lines (id, tenant_id, po_id, line_no, supplier_item_id, description, metal_type, purity, hsn, qty, gross_weight, net_weight, stone_weight, rate_basis, rate, price_override, discount, gst_pct, taxable, gst_amount, line_total, stones, received_qty, rejected_qty, item_type) FROM stdin;
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_orders (id, tenant_id, po_no, supplier_id, po_date, expected_date, tax_mode, status, subtotal, discount, taxable, cgst, sgst, igst, other_charges, total, terms, notes, delivery_location, courier, tracking_no, created_by, approved_by, approved_at, cancel_reason, row_version, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refined_metal_ledger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refined_metal_ledger (id, tenant_id, entry_date, metal, entry_type, qty_fine, purity, rate_10g, amount, refinery_job_id, supplier_payment_id, ref_no, notes, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: refinery_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refinery_jobs (id, tenant_id, job_no, metal, status, refiner, carried_by, sent_date, pieces, sent_gross, sent_net, sent_fine, sent_value, received_date, received_fine, received_purity, loss_fine, loss_pct, charges, charges_outflow_id, notes, receive_notes, cancel_reason, created_by, received_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: register_change_flags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.register_change_flags (id, tenant_id, session_id, source, source_id, change, at) FROM stdin;
\.


--
-- Data for Name: register_counters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.register_counters (id, tenant_id, code, name, is_active, created_at) FROM stdin;
1	788195d6-463b-4f94-bfeb-41aad2c84f5e	MAIN	Main counter	t	2026-11-15 10:55:11.532384+00
\.


--
-- Data for Name: register_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.register_entries (id, tenant_id, session_id, entry_no, entry_type, category, amount, notes, voided, void_reason, voided_by, voided_at, created_by, created_at) FROM stdin;
1	788195d6-463b-4f94-bfeb-41aad2c84f5e	1	RCE-2026-00001	expense	Tea / refreshments	30.00	bablu chai	f	\N	\N	\N	1	2026-11-15 11:38:23.936959+00
\.


--
-- Data for Name: register_reopen_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.register_reopen_log (id, tenant_id, session_id, reopened_by, reason, previous, at) FROM stdin;
\.


--
-- Data for Name: register_session_modes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.register_session_modes (session_id, mode, tenant_id, receipts, refunds, net, count) FROM stdin;
\.


--
-- Data for Name: register_session_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.register_session_users (session_id, user_id, tenant_id, joined_at, left_at) FROM stdin;
1	1	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:37:37.992991+00	\N
\.


--
-- Data for Name: register_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.register_sessions (id, tenant_id, session_no, counter_id, business_date, status, opening_cash, opening_counts, opening_remarks, opened_by, opened_at, closing_started_at, closing_started_by, expected_cash, actual_cash, difference, difference_reason, approved_by, closing_counts, snapshot, closed_by, closed_at, reopened_count, changed_after_close, row_version) FROM stdin;
1	788195d6-463b-4f94-bfeb-41aad2c84f5e	REG-2026-00001	1	2026-11-15	closing	50000.00	\N	\N	1	2026-11-15 11:37:37.992991+00	2026-11-15 11:38:54.578243+00	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	f	2
\.


--
-- Data for Name: repair_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_items (id, repair_id, description, metal_type, gross_weight, issue_type, special_note, tenant_id, item_status, delivery_date, item_type, quantity, item_condition, accessories, repair_cost) FROM stdin;
\.


--
-- Data for Name: repairs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repairs (id, repair_no, customer_id, customer_name, phone, estimated_cost, final_cost, advance_paid, balance_due, received_date, promised_date, delivered_date, status, technician, notes, created_by, created_at, updated_at, tenant_id, service_type, sac_code, gst_pct, invoice_no, invoice_date, taxable_amount, gst_amount, invoice_total, receipt_no, receipt_first_printed, receipt_print_count) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (role_id, permission_key, tenant_id) FROM stdin;
1	dashboard.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	customers.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	customers.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	customers.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	customers.view_kyc	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	customers.export	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	rates.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	rates.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	inventory.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	inventory.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	inventory.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	inventory.edit_others	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	inventory.adjust	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	inventory.import	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	inventory.view_cost	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	inventory.images	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	inventory.verify	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	tags.print	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	sales.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	sales.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	sales.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	sales.discount_above_limit	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	sales.cancel	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	sales.deliver	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	sales.print	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	sales.view_margin	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	payments.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	payments.void	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	payments.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	bookings.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	bookings.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	bookings.settle	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	bookings.refund	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	buyback.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	buyback.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	repairs.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	repairs.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	repairs.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	repairs.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	loans.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	loans.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	loans.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	loans.close	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	loans.waive	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	loans.return_item	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	oldgold.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	oldgold.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	oldgold.settle	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	oldgold.undo_exchange	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	metalstock.move	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	suppliers.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	suppliers.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	suppliers.activate	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	po.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	po.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	po.approve	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	po.cancel_close	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	po.price_override	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	grn.post	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	grn.reverse	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	bills.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	bills.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	bills.post	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	bills.cancel	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	bills.documents	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	supplier_payments.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	supplier_payments.void	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	register.open	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	register.close	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	register.cash_entries	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	register.reopen	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	register.approve_difference	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	register.attach	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	reports.sales	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	reports.purchase	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	reports.stock	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	reports.margin	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	reports.gst	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	settings.shop	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	settings.gst_invoice	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	settings.theme	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	settings.login_page	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	settings.security	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	settings.integrations	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	settings.tags	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	users.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	users.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	users.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	users.disable	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	users.reset_password	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	roles.manage	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	integrations.api_keys	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	integrations.webhooks	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	logs.view_audit	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	logs.view_errors	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	dashboard.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	customers.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	customers.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	customers.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	customers.view_kyc	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	customers.export	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	rates.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	rates.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	inventory.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	inventory.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	inventory.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	inventory.edit_others	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	inventory.adjust	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	inventory.import	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	inventory.view_cost	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	inventory.images	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	inventory.verify	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	tags.print	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	sales.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	sales.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	sales.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	sales.discount_above_limit	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	sales.cancel	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	sales.deliver	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	sales.print	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	sales.view_margin	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	payments.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	payments.void	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	payments.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	bookings.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	bookings.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	bookings.settle	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	bookings.refund	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	buyback.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	buyback.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	repairs.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	repairs.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	repairs.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	repairs.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	loans.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	loans.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	loans.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	loans.close	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	loans.waive	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	loans.return_item	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	oldgold.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	oldgold.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	oldgold.settle	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	oldgold.undo_exchange	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	metalstock.move	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	suppliers.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	suppliers.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	suppliers.activate	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	po.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	po.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	po.approve	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	po.cancel_close	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	po.price_override	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	grn.post	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	grn.reverse	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	bills.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	bills.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	bills.post	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	bills.cancel	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	bills.documents	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	supplier_payments.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	supplier_payments.void	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	register.open	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	register.close	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	register.cash_entries	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	register.reopen	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	register.approve_difference	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	register.attach	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	reports.sales	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	reports.purchase	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	reports.stock	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	reports.margin	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	reports.gst	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	settings.shop	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	settings.gst_invoice	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	settings.theme	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	settings.login_page	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	settings.security	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	settings.integrations	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	settings.tags	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	users.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	users.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	users.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	users.disable	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	users.reset_password	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	roles.manage	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	integrations.api_keys	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	integrations.webhooks	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	logs.view_audit	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	logs.view_errors	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	dashboard.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	customers.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	customers.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	customers.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	customers.view_kyc	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	customers.export	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	rates.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	rates.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	inventory.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	inventory.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	inventory.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	inventory.edit_others	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	inventory.adjust	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	inventory.import	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	inventory.view_cost	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	inventory.images	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	inventory.verify	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	tags.print	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	sales.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	sales.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	sales.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	sales.discount_above_limit	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	sales.cancel	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	sales.deliver	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	sales.print	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	sales.view_margin	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	payments.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	payments.void	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	payments.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	bookings.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	bookings.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	bookings.settle	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	bookings.refund	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	buyback.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	buyback.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	repairs.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	repairs.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	repairs.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	repairs.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	loans.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	loans.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	loans.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	loans.close	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	loans.waive	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	loans.return_item	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	oldgold.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	oldgold.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	oldgold.settle	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	oldgold.undo_exchange	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	metalstock.move	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	suppliers.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	suppliers.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	suppliers.activate	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	po.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	po.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	po.approve	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	po.cancel_close	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	po.price_override	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	grn.post	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	grn.reverse	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	bills.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	bills.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	bills.post	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	bills.cancel	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	bills.documents	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	supplier_payments.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	supplier_payments.void	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	register.open	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	register.close	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	register.cash_entries	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	register.reopen	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	register.approve_difference	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	register.attach	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	reports.sales	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	reports.purchase	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	reports.stock	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	reports.margin	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	reports.gst	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	settings.shop	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	settings.gst_invoice	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	settings.theme	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	settings.login_page	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	settings.tags	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	users.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	users.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	users.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	users.disable	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	logs.view_audit	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	dashboard.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	customers.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	customers.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	rates.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	inventory.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	sales.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	sales.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	sales.print	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	sales.deliver	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	payments.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	payments.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	bookings.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	bookings.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	repairs.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	repairs.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	loans.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	loans.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	loans.return_item	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	oldgold.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	register.open	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	register.close	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	register.cash_entries	788195d6-463b-4f94-bfeb-41aad2c84f5e
4	tags.print	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	dashboard.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	customers.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	customers.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	customers.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	rates.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	inventory.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	inventory.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	inventory.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	inventory.edit_others	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	inventory.images	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	inventory.verify	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	tags.print	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	sales.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	sales.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	sales.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	sales.deliver	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	sales.print	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	payments.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	payments.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	bookings.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	bookings.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	bookings.settle	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	bookings.refund	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	buyback.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	repairs.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	repairs.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	repairs.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	repairs.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	loans.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	loans.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	loans.collect	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	loans.return_item	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	oldgold.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	oldgold.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	oldgold.settle	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	register.open	788195d6-463b-4f94-bfeb-41aad2c84f5e
5	register.cash_entries	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	dashboard.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	customers.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	rates.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	inventory.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	sales.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	payments.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	bookings.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	buyback.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	repairs.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	loans.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	oldgold.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	suppliers.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	po.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	bills.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	users.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	bills.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	bills.post	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	bills.cancel	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	bills.documents	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	supplier_payments.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	supplier_payments.void	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	reports.sales	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	reports.purchase	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	reports.stock	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	reports.margin	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	reports.gst	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	customers.export	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	inventory.view_cost	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	sales.print	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	sales.view_margin	788195d6-463b-4f94-bfeb-41aad2c84f5e
6	logs.view_audit	788195d6-463b-4f94-bfeb-41aad2c84f5e
7	inventory.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
7	inventory.create	788195d6-463b-4f94-bfeb-41aad2c84f5e
7	inventory.edit	788195d6-463b-4f94-bfeb-41aad2c84f5e
7	inventory.adjust	788195d6-463b-4f94-bfeb-41aad2c84f5e
7	inventory.images	788195d6-463b-4f94-bfeb-41aad2c84f5e
7	inventory.verify	788195d6-463b-4f94-bfeb-41aad2c84f5e
7	tags.print	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	dashboard.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	customers.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	rates.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	inventory.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	sales.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	payments.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	bookings.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	buyback.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	repairs.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	loans.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	oldgold.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	suppliers.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	po.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	bills.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
8	users.view	788195d6-463b-4f94-bfeb-41aad2c84f5e
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, tenant_id, name, description, is_system, system_key, row_version, created_at, updated_at) FROM stdin;
8	788195d6-463b-4f94-bfeb-41aad2c84f5e	Viewer	Read-only.	t	viewer	1	2026-11-15 10:55:11.979303+00	2026-11-15 10:55:11.979303+00
1	788195d6-463b-4f94-bfeb-41aad2c84f5e	Owner	Shop owner (Master Admin). Holds every permission. Protected.	t	owner	1	2026-11-15 10:55:11.979303+00	2026-11-15 10:55:11.979303+00
2	788195d6-463b-4f94-bfeb-41aad2c84f5e	Admin	Full access to the shop, including users and settings.	t	admin	1	2026-11-15 10:55:11.979303+00	2026-11-15 10:55:11.979303+00
3	788195d6-463b-4f94-bfeb-41aad2c84f5e	Manager	Runs the shop day to day. No security, integrations or role editing.	t	manager	1	2026-11-15 10:55:11.979303+00	2026-11-15 10:55:11.979303+00
4	788195d6-463b-4f94-bfeb-41aad2c84f5e	Cashier	Counter billing, receipts and the cash register.	t	cashier	1	2026-11-15 10:55:11.979303+00	2026-11-15 10:55:11.979303+00
5	788195d6-463b-4f94-bfeb-41aad2c84f5e	Sales	Sales staff: customers, orders, bookings, repairs, old gold. (Legacy "staff" users get this role.)	t	sales	1	2026-11-15 10:55:11.979303+00	2026-11-15 10:55:11.979303+00
6	788195d6-463b-4f94-bfeb-41aad2c84f5e	Accountant	Views everything, runs reports and exports, handles bills and supplier payments.	t	accountant	1	2026-11-15 10:55:11.979303+00	2026-11-15 10:55:11.979303+00
7	788195d6-463b-4f94-bfeb-41aad2c84f5e	Stock Manager	Inventory only: adds stock items and edits the items he added. Items added by others open read-only.	t	stock_manager	1	2026-11-15 10:55:11.979303+00	2026-11-15 10:55:11.979303+00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, tenant_id, created_at, last_seen_at, expires_at, ip, user_agent, revoked_at, revoked_by, revoke_reason) FROM stdin;
de401cdb-fc17-47ba-968b-dd0f008a5bcc	1	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:42:17.268321+00	2026-11-15 11:44:05.273629+00	2026-11-15 23:42:17.268321+00	127.0.0.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36	\N	\N	\N
bff3f72a-7081-4661-af02-0d784db90299	1	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:13:59.108294+00	2026-11-15 12:48:49.294935+00	2026-11-15 23:13:59.108294+00	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	\N	\N	\N
a480c1b0-29c2-4c44-8f28-afa847fc40eb	1	788195d6-463b-4f94-bfeb-41aad2c84f5e	2026-11-15 11:35:14.795266+00	2026-11-15 12:25:15.633714+00	2026-11-15 23:35:14.795266+00	127.0.0.1	Mozilla/5.0 (Linux; Android 13; IV2201 Build/TP1A.220905.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/156.0.8078.47 Mobile Safari/537.36 WA4A/2.26.44.90	\N	\N	\N
\.


--
-- Data for Name: shipments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shipments (id, tenant_id, shipment_no, sales_order_id, repair_id, courier, provider_order_id, provider_shipment_id, awb_no, status, declared_value, insured, weight_g, dimensions, ship_to, pickup_at, delivered_at, tracking, label_file_id, external_ref, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: shop_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shop_settings (id, shop_name, owner_name, address, city, state, pincode, phone, phone2, email, gst_no, pan_no, logo_url, currency, gold_gst_rate, silver_gst_rate, making_gst_rate, gst_enabled, financial_year_start, invoice_prefix, loan_prefix, repair_prefix, booking_prefix, updated_at, singleton_key, tenant_id, shop_code) FROM stdin;
1	S.B Borana Jewellers	Sujal shah	3-5 Niwas , Vile parle east Mumbai	Mumbai	Maharashtra	400057	9324773823	\N	\N	27ACZPJ7126B1ZA	\N	\N	INR	3.00	3.00	5.00	t	04-01	INV	LOAN	REP	BKG	2026-11-15 11:22:47.560805+00	main	788195d6-463b-4f94-bfeb-41aad2c84f5e	SBJ
\.


--
-- Data for Name: shop_settings_v2; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shop_settings_v2 (tenant_id, grp, data, row_version, updated_by, updated_at) FROM stdin;
788195d6-463b-4f94-bfeb-41aad2c84f5e	theme	{"gold": "#c5a46d", "mode": "light", "accent": "#c5a46d", "preset": "classic_light", "radius": "rounded", "density": "comfortable", "primary": "#237a57", "fontScale": 1, "navLayout": "sidebar", "secondary": "#202522", "sidebarBg": "#ffffff", "fontFamily": "inter", "tableZebra": false, "buttonStyle": "solid", "sidebarStyle": "light", "dashboardTiles": ["today_sales", "today_collections", "outstanding", "open_repairs", "active_loans", "low_stock"], "sidebarCollapsed": false}	1	1	2026-11-15 11:23:19.399265+00
\.


--
-- Data for Name: stock_audit_counts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_audit_counts (id, tenant_id, audit_id, category, metal, pcs, gross, net, notes, counted_by, counted_at, superseded_at, superseded_by, sys_pcs, sys_gross, sys_net) FROM stdin;
\.


--
-- Data for Name: stock_audit_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_audit_lines (id, tenant_id, audit_id, item_id, item_code, name, category, metal_type, purity, huid, gross_weight, net_weight, unit_value, system_qty, counted_qty, status) FROM stdin;
\.


--
-- Data for Name: stock_audit_scans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_audit_scans (id, tenant_id, audit_id, code, item_id, qty, result, sold_ref, scanned_by, scanned_at, voided_at, voided_by, source) FROM stdin;
\.


--
-- Data for Name: stock_audits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_audits (id, tenant_id, audit_no, name, categories, metal_types, notes, status, started_by, started_at, completed_by, completed_at, cancel_reason, summary, row_version, method, blind) FROM stdin;
\.


--
-- Data for Name: supplier_bill_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_bill_lines (id, tenant_id, bill_id, grn_line_id, description, hsn, qty, net_weight, stone_weight, rate_basis, rate, po_rate, expected_amount, taxable, gst_pct, po_gst_pct, gst_amount, line_total, variance, variance_flag) FROM stdin;
\.


--
-- Data for Name: supplier_bills; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_bills (id, tenant_id, bill_no, supplier_id, supplier_invoice_no, supplier_invoice_date, bill_date, tax_mode, taxable, cgst, sgst, igst, other_charges, round_off, printed_total, total, itc_eligible, due_date, status, pay_status, paid_amount, duplicate_override, has_variance, notes, created_by, posted_by, posted_at, cancelled_by, cancelled_at, cancel_reason, row_version, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: supplier_item_rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_item_rates (id, tenant_id, supplier_item_id, rate_basis, rate, effective_from, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: supplier_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_items (id, tenant_id, supplier_id, supplier_item_code, sku, design_no, brand, name, metal_type, purity, hsn, gross_weight, net_weight, stone_weight, rate_basis, current_rate, gst_pct, stones, is_active, created_by, created_at, updated_at, item_type, category) FROM stdin;
\.


--
-- Data for Name: supplier_payment_allocations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_payment_allocations (id, tenant_id, payment_id, bill_id, amount, voided, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: supplier_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_payments (id, tenant_id, payment_no, supplier_id, payment_date, amount, payment_mode, utr, notes, unallocated, outflow_id, status, void_reason, voided_by, voided_at, created_by, created_at, opening_applied, money_amount, metal_type, metal_fine_qty, metal_purity, metal_rate_10g, metal_amount) FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, supplier_code, name, phone, email, address, gst_no, pan_no, credit_days, opening_balance, is_active, created_at, tenant_id, supplier_type, gst_reg_type, state_code, contact_person, phone2, city, state, pincode, payment_terms, bank_name, bank_account, ifsc, notes, row_version, updated_at, created_by) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenants (id, shop_code, legal_name, display_name, subdomain, status, is_default, created_at) FROM stdin;
788195d6-463b-4f94-bfeb-41aad2c84f5e	SHOP0001	My Jewellery Shop	My Jewellery Shop	\N	active	t	2026-11-15 10:55:11.113385+00
\.


--
-- Data for Name: user_permission_overrides; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_permission_overrides (user_id, permission_key, effect, tenant_id) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (user_id, role_id, tenant_id) FROM stdin;
1	2	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	1	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	4	788195d6-463b-4f94-bfeb-41aad2c84f5e
2	5	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	8	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	6	788195d6-463b-4f94-bfeb-41aad2c84f5e
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, role, phone, is_active, created_at, username, is_owner, must_change_password, failed_logins, locked_until, last_login_at, password_changed_at, pw_changed_by, recovery_hash, disabled_reason, disabled_at, disabled_by, row_version, updated_at, tenant_id) FROM stdin;
2	Sandeep Shah	sandeepshah2000@gmail.com	pbkdf2$sha256$210000$ZQIMd9faiUGX4X4+zIVWvA==$sJ7d4kS3x7/PoTRMoMdSdBCd/qFqU17Fif0IvlKYU4U=	staff	\N	t	2026-11-15 11:25:56.396094+00	sandeepshah2000@gmail.com	f	t	0	\N	\N	2026-11-15 11:25:56.396094+00	\N	\N	\N	\N	\N	1	2026-11-15 11:25:56.396094+00	788195d6-463b-4f94-bfeb-41aad2c84f5e
3	Rahul Jain	sbjrahul01@gmail.com	pbkdf2$sha256$210000$MtCjuia17oHbjBQPUpQzQw==$ataTV5opxiMDyOmfVRqdWw6b9nMhQXq1Jo30cH5tRrI=	accountant	\N	t	2026-11-15 11:27:00.180932+00	sbjrahul01@gmail.com	f	t	0	\N	\N	2026-11-15 11:27:00.180932+00	\N	\N	\N	\N	\N	1	2026-11-15 11:27:00.180932+00	788195d6-463b-4f94-bfeb-41aad2c84f5e
1	Admin	admin@jewellery.com	pbkdf2$sha256$210000$OTTivaCpYA9XCaSXsvVI+A==$ee8yrAm9CdjTlgAFvLc+7+sWDD6oI4UsOqB0TlPVmhY=	admin	\N	t	2026-11-15 10:55:11.977312+00	\N	t	f	0	\N	2026-11-15 11:42:17.268321+00	2026-11-15 11:15:54.270624+00	\N	\N	\N	\N	\N	2	2026-11-15 10:55:11.977312+00	788195d6-463b-4f94-bfeb-41aad2c84f5e
\.


--
-- Data for Name: webhook_deliveries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.webhook_deliveries (id, tenant_id, subscription_id, event_id, event_type, payload, attempt, status, response_code, response_body, next_retry_at, delivered_at, created_at) FROM stdin;
\.


--
-- Data for Name: webhook_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.webhook_subscriptions (id, tenant_id, url, events, secret_enc, description, status, failure_count, disabled_reason, created_by, created_at) FROM stdin;
\.


--
-- Name: advance_reversals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.advance_reversals_id_seq', 1, false);


--
-- Name: api_clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.api_clients_id_seq', 1, false);


--
-- Name: api_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.api_keys_id_seq', 1, false);


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 13, true);


--
-- Name: booking_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.booking_items_id_seq', 1, false);


--
-- Name: booking_metal_deposits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.booking_metal_deposits_id_seq', 1, false);


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bookings_id_seq', 1, false);


--
-- Name: buyback_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.buyback_items_id_seq', 1, false);


--
-- Name: buybacks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.buybacks_id_seq', 1, false);


--
-- Name: cancellation_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cancellation_items_id_seq', 1, false);


--
-- Name: cancellations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cancellations_id_seq', 1, false);


--
-- Name: cash_outflows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cash_outflows_id_seq', 1, false);


--
-- Name: credit_memos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.credit_memos_id_seq', 1, false);


--
-- Name: customer_credits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_credits_id_seq', 1, false);


--
-- Name: customer_visits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_visits_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 1, false);


--
-- Name: daily_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.daily_rates_id_seq', 1, false);


--
-- Name: deposit_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.deposit_payments_id_seq', 1, false);


--
-- Name: deposits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.deposits_id_seq', 1, false);


--
-- Name: document_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.document_links_id_seq', 1, false);


--
-- Name: domain_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.domain_events_id_seq', 2, true);


--
-- Name: error_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.error_logs_id_seq', 1, false);


--
-- Name: gateway_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.gateway_events_id_seq', 1, false);


--
-- Name: goods_receipt_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.goods_receipt_lines_id_seq', 1, false);


--
-- Name: goods_receipt_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.goods_receipt_tags_id_seq', 1, false);


--
-- Name: goods_receipts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.goods_receipts_id_seq', 1, false);


--
-- Name: gst_2b_imports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.gst_2b_imports_id_seq', 1, false);


--
-- Name: gst_2b_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.gst_2b_lines_id_seq', 1, false);


--
-- Name: inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_id_seq', 1, true);


--
-- Name: inventory_stones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_stones_id_seq', 1, false);


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_transactions_id_seq', 1, true);


--
-- Name: item_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.item_images_id_seq', 1, false);


--
-- Name: license_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.license_keys_id_seq', 1, true);


--
-- Name: loan_emi_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.loan_emi_records_id_seq', 1, false);


--
-- Name: loan_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.loan_items_id_seq', 1, false);


--
-- Name: loan_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.loan_transactions_id_seq', 1, false);


--
-- Name: loans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.loans_id_seq', 1, false);


--
-- Name: metal_stock_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.metal_stock_history_id_seq', 1, false);


--
-- Name: metal_stock_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.metal_stock_movements_id_seq', 1, false);


--
-- Name: old_gold_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.old_gold_items_id_seq', 1, false);


--
-- Name: old_gold_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.old_gold_payments_id_seq', 1, false);


--
-- Name: old_gold_purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.old_gold_purchases_id_seq', 1, false);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_items_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- Name: payment_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_allocations_id_seq', 1, false);


--
-- Name: payment_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_links_id_seq', 1, false);


--
-- Name: payment_receipts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_receipts_id_seq', 1, false);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: platform_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.platform_users_id_seq', 1, false);


--
-- Name: purchase_order_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchase_order_lines_id_seq', 1, false);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 1, false);


--
-- Name: refined_metal_ledger_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refined_metal_ledger_id_seq', 1, false);


--
-- Name: refinery_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refinery_jobs_id_seq', 1, false);


--
-- Name: register_change_flags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.register_change_flags_id_seq', 1, false);


--
-- Name: register_counters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.register_counters_id_seq', 1, true);


--
-- Name: register_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.register_entries_id_seq', 1, true);


--
-- Name: register_reopen_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.register_reopen_log_id_seq', 1, false);


--
-- Name: register_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.register_sessions_id_seq', 1, true);


--
-- Name: repair_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.repair_items_id_seq', 1, false);


--
-- Name: repairs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.repairs_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 112, true);


--
-- Name: shipments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shipments_id_seq', 1, false);


--
-- Name: shop_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shop_settings_id_seq', 15, true);


--
-- Name: stock_audit_counts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_audit_counts_id_seq', 1, false);


--
-- Name: stock_audit_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_audit_lines_id_seq', 1, false);


--
-- Name: stock_audit_scans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_audit_scans_id_seq', 1, false);


--
-- Name: stock_audits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_audits_id_seq', 1, false);


--
-- Name: supplier_bill_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.supplier_bill_lines_id_seq', 1, false);


--
-- Name: supplier_bills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.supplier_bills_id_seq', 1, false);


--
-- Name: supplier_item_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.supplier_item_rates_id_seq', 1, false);


--
-- Name: supplier_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.supplier_items_id_seq', 1, false);


--
-- Name: supplier_payment_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.supplier_payment_allocations_id_seq', 1, false);


--
-- Name: supplier_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.supplier_payments_id_seq', 1, false);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: webhook_deliveries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.webhook_deliveries_id_seq', 1, false);


--
-- Name: webhook_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.webhook_subscriptions_id_seq', 1, false);


--
-- Name: advance_reversals advance_reversals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advance_reversals
    ADD CONSTRAINT advance_reversals_pkey PRIMARY KEY (id);


--
-- Name: api_clients api_clients_client_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_clients
    ADD CONSTRAINT api_clients_client_id_key UNIQUE (client_id);


--
-- Name: api_clients api_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_clients
    ADD CONSTRAINT api_clients_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_key_prefix_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_prefix_key UNIQUE (key_prefix);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: booking_items booking_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_items
    ADD CONSTRAINT booking_items_pkey PRIMARY KEY (id);


--
-- Name: booking_metal_deposits booking_metal_deposits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_metal_deposits
    ADD CONSTRAINT booking_metal_deposits_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_booking_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_booking_no_key UNIQUE (booking_no);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: buyback_items buyback_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyback_items
    ADD CONSTRAINT buyback_items_pkey PRIMARY KEY (id);


--
-- Name: buybacks buybacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buybacks
    ADD CONSTRAINT buybacks_pkey PRIMARY KEY (id);


--
-- Name: buybacks buybacks_tenant_id_buyback_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buybacks
    ADD CONSTRAINT buybacks_tenant_id_buyback_no_key UNIQUE (tenant_id, buyback_no);


--
-- Name: cancellation_items cancellation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_items
    ADD CONSTRAINT cancellation_items_pkey PRIMARY KEY (id);


--
-- Name: cancellations cancellations_cancellation_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellations
    ADD CONSTRAINT cancellations_cancellation_no_key UNIQUE (cancellation_no);


--
-- Name: cancellations cancellations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellations
    ADD CONSTRAINT cancellations_pkey PRIMARY KEY (id);


--
-- Name: cash_outflows cash_outflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_outflows
    ADD CONSTRAINT cash_outflows_pkey PRIMARY KEY (id);


--
-- Name: cash_outflows cash_outflows_tenant_id_outflow_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_outflows
    ADD CONSTRAINT cash_outflows_tenant_id_outflow_no_key UNIQUE (tenant_id, outflow_no);


--
-- Name: credit_memos credit_memos_credit_memo_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_memos
    ADD CONSTRAINT credit_memos_credit_memo_no_key UNIQUE (credit_memo_no);


--
-- Name: credit_memos credit_memos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_memos
    ADD CONSTRAINT credit_memos_pkey PRIMARY KEY (id);


--
-- Name: customer_credits customer_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_credits
    ADD CONSTRAINT customer_credits_pkey PRIMARY KEY (id);


--
-- Name: customer_visits customer_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_visits
    ADD CONSTRAINT customer_visits_pkey PRIMARY KEY (id);


--
-- Name: customers customers_customer_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_customer_code_key UNIQUE (customer_code);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: daily_rates daily_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_rates
    ADD CONSTRAINT daily_rates_pkey PRIMARY KEY (id);


--
-- Name: deposit_payments deposit_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposit_payments
    ADD CONSTRAINT deposit_payments_pkey PRIMARY KEY (id);


--
-- Name: deposits deposits_deposit_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_deposit_no_key UNIQUE (deposit_no);


--
-- Name: deposits deposits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_pkey PRIMARY KEY (id);


--
-- Name: doc_counters doc_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doc_counters
    ADD CONSTRAINT doc_counters_pkey PRIMARY KEY (tenant_id, series, period);


--
-- Name: document_links document_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_links
    ADD CONSTRAINT document_links_pkey PRIMARY KEY (id);


--
-- Name: domain_events domain_events_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.domain_events
    ADD CONSTRAINT domain_events_event_id_key UNIQUE (event_id);


--
-- Name: domain_events domain_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.domain_events
    ADD CONSTRAINT domain_events_pkey PRIMARY KEY (id);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: file_blobs file_blobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_blobs
    ADD CONSTRAINT file_blobs_pkey PRIMARY KEY (file_id, variant);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: gateway_events gateway_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gateway_events
    ADD CONSTRAINT gateway_events_pkey PRIMARY KEY (id);


--
-- Name: gateway_events gateway_events_provider_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gateway_events
    ADD CONSTRAINT gateway_events_provider_event_id_key UNIQUE (provider, event_id);


--
-- Name: goods_receipt_lines goods_receipt_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipt_lines
    ADD CONSTRAINT goods_receipt_lines_pkey PRIMARY KEY (id);


--
-- Name: goods_receipt_tags goods_receipt_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipt_tags
    ADD CONSTRAINT goods_receipt_tags_pkey PRIMARY KEY (id);


--
-- Name: goods_receipts goods_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_pkey PRIMARY KEY (id);


--
-- Name: goods_receipts goods_receipts_tenant_id_grn_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_tenant_id_grn_no_key UNIQUE (tenant_id, grn_no);


--
-- Name: gst_2b_imports gst_2b_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gst_2b_imports
    ADD CONSTRAINT gst_2b_imports_pkey PRIMARY KEY (id);


--
-- Name: gst_2b_lines gst_2b_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gst_2b_lines
    ADD CONSTRAINT gst_2b_lines_pkey PRIMARY KEY (id);


--
-- Name: idempotency_keys idempotency_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_pkey PRIMARY KEY (tenant_id, actor, key);


--
-- Name: integration_credentials integration_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_credentials
    ADD CONSTRAINT integration_credentials_pkey PRIMARY KEY (tenant_id, provider);


--
-- Name: inventory inventory_item_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_item_code_key UNIQUE (item_code);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: inventory_stones inventory_stones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_stones
    ADD CONSTRAINT inventory_stones_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: item_images item_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_images
    ADD CONSTRAINT item_images_pkey PRIMARY KEY (id);


--
-- Name: kj_migrations kj_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kj_migrations
    ADD CONSTRAINT kj_migrations_pkey PRIMARY KEY (version);


--
-- Name: license_keys license_keys_license_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_license_key_key UNIQUE (license_key);


--
-- Name: license_keys license_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_license_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_license_key_key UNIQUE (license_key);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_tenant_id_key UNIQUE (tenant_id);


--
-- Name: loan_emi_records loan_emi_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_emi_records
    ADD CONSTRAINT loan_emi_records_pkey PRIMARY KEY (id);


--
-- Name: loan_items loan_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_items
    ADD CONSTRAINT loan_items_pkey PRIMARY KEY (id);


--
-- Name: loan_transactions loan_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_transactions
    ADD CONSTRAINT loan_transactions_pkey PRIMARY KEY (id);


--
-- Name: loans loans_loan_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_loan_no_key UNIQUE (loan_no);


--
-- Name: loans loans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_pkey PRIMARY KEY (id);


--
-- Name: metal_stock_history metal_stock_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metal_stock_history
    ADD CONSTRAINT metal_stock_history_pkey PRIMARY KEY (id);


--
-- Name: metal_stock_movements metal_stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metal_stock_movements
    ADD CONSTRAINT metal_stock_movements_pkey PRIMARY KEY (id);


--
-- Name: old_gold_items old_gold_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.old_gold_items
    ADD CONSTRAINT old_gold_items_pkey PRIMARY KEY (id);


--
-- Name: old_gold_payments old_gold_payments_payment_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.old_gold_payments
    ADD CONSTRAINT old_gold_payments_payment_no_key UNIQUE (payment_no);


--
-- Name: old_gold_payments old_gold_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.old_gold_payments
    ADD CONSTRAINT old_gold_payments_pkey PRIMARY KEY (id);


--
-- Name: old_gold_purchases old_gold_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.old_gold_purchases
    ADD CONSTRAINT old_gold_purchases_pkey PRIMARY KEY (id);


--
-- Name: old_gold_purchases old_gold_purchases_purchase_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.old_gold_purchases
    ADD CONSTRAINT old_gold_purchases_purchase_no_key UNIQUE (purchase_no);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_no_key UNIQUE (order_no);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: payment_allocations payment_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_pkey PRIMARY KEY (id);


--
-- Name: payment_links payment_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_links
    ADD CONSTRAINT payment_links_pkey PRIMARY KEY (id);


--
-- Name: payment_links payment_links_provider_provider_link_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_links
    ADD CONSTRAINT payment_links_provider_provider_link_id_key UNIQUE (provider, provider_link_id);


--
-- Name: payment_receipts payment_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_pkey PRIMARY KEY (id);


--
-- Name: payment_receipts payment_receipts_tenant_id_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_tenant_id_payment_id_key UNIQUE (tenant_id, payment_id);


--
-- Name: payments payments_payment_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_no_key UNIQUE (payment_no);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (key);


--
-- Name: platform_users platform_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_email_key UNIQUE (email);


--
-- Name: platform_users platform_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_lines purchase_order_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_tenant_id_po_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_tenant_id_po_no_key UNIQUE (tenant_id, po_no);


--
-- Name: refined_metal_ledger refined_metal_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refined_metal_ledger
    ADD CONSTRAINT refined_metal_ledger_pkey PRIMARY KEY (id);


--
-- Name: refinery_jobs refinery_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refinery_jobs
    ADD CONSTRAINT refinery_jobs_pkey PRIMARY KEY (id);


--
-- Name: refinery_jobs refinery_jobs_tenant_id_job_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refinery_jobs
    ADD CONSTRAINT refinery_jobs_tenant_id_job_no_key UNIQUE (tenant_id, job_no);


--
-- Name: register_change_flags register_change_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_change_flags
    ADD CONSTRAINT register_change_flags_pkey PRIMARY KEY (id);


--
-- Name: register_counters register_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_counters
    ADD CONSTRAINT register_counters_pkey PRIMARY KEY (id);


--
-- Name: register_counters register_counters_tenant_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_counters
    ADD CONSTRAINT register_counters_tenant_id_code_key UNIQUE (tenant_id, code);


--
-- Name: register_entries register_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_entries
    ADD CONSTRAINT register_entries_pkey PRIMARY KEY (id);


--
-- Name: register_entries register_entries_tenant_id_entry_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_entries
    ADD CONSTRAINT register_entries_tenant_id_entry_no_key UNIQUE (tenant_id, entry_no);


--
-- Name: register_reopen_log register_reopen_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_reopen_log
    ADD CONSTRAINT register_reopen_log_pkey PRIMARY KEY (id);


--
-- Name: register_session_modes register_session_modes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_session_modes
    ADD CONSTRAINT register_session_modes_pkey PRIMARY KEY (session_id, mode);


--
-- Name: register_session_users register_session_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_session_users
    ADD CONSTRAINT register_session_users_pkey PRIMARY KEY (session_id, user_id);


--
-- Name: register_sessions register_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_sessions
    ADD CONSTRAINT register_sessions_pkey PRIMARY KEY (id);


--
-- Name: register_sessions register_sessions_tenant_id_counter_id_business_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_sessions
    ADD CONSTRAINT register_sessions_tenant_id_counter_id_business_date_key UNIQUE (tenant_id, counter_id, business_date);


--
-- Name: register_sessions register_sessions_tenant_id_session_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_sessions
    ADD CONSTRAINT register_sessions_tenant_id_session_no_key UNIQUE (tenant_id, session_no);


--
-- Name: repair_items repair_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_items
    ADD CONSTRAINT repair_items_pkey PRIMARY KEY (id);


--
-- Name: repairs repairs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repairs
    ADD CONSTRAINT repairs_pkey PRIMARY KEY (id);


--
-- Name: repairs repairs_repair_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repairs
    ADD CONSTRAINT repairs_repair_no_key UNIQUE (repair_no);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_key);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles roles_tenant_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_tenant_id_name_key UNIQUE (tenant_id, name);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: shipments shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (id);


--
-- Name: shipments shipments_tenant_id_shipment_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_tenant_id_shipment_no_key UNIQUE (tenant_id, shipment_no);


--
-- Name: shop_settings shop_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_settings
    ADD CONSTRAINT shop_settings_pkey PRIMARY KEY (id);


--
-- Name: shop_settings shop_settings_singleton_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_settings
    ADD CONSTRAINT shop_settings_singleton_key_key UNIQUE (singleton_key);


--
-- Name: shop_settings_v2 shop_settings_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_settings_v2
    ADD CONSTRAINT shop_settings_v2_pkey PRIMARY KEY (tenant_id, grp);


--
-- Name: stock_audit_counts stock_audit_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audit_counts
    ADD CONSTRAINT stock_audit_counts_pkey PRIMARY KEY (id);


--
-- Name: stock_audit_lines stock_audit_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audit_lines
    ADD CONSTRAINT stock_audit_lines_pkey PRIMARY KEY (id);


--
-- Name: stock_audit_scans stock_audit_scans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audit_scans
    ADD CONSTRAINT stock_audit_scans_pkey PRIMARY KEY (id);


--
-- Name: stock_audits stock_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audits
    ADD CONSTRAINT stock_audits_pkey PRIMARY KEY (id);


--
-- Name: supplier_bill_lines supplier_bill_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_bill_lines
    ADD CONSTRAINT supplier_bill_lines_pkey PRIMARY KEY (id);


--
-- Name: supplier_bills supplier_bills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_bills
    ADD CONSTRAINT supplier_bills_pkey PRIMARY KEY (id);


--
-- Name: supplier_bills supplier_bills_tenant_id_bill_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_bills
    ADD CONSTRAINT supplier_bills_tenant_id_bill_no_key UNIQUE (tenant_id, bill_no);


--
-- Name: supplier_item_rates supplier_item_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_item_rates
    ADD CONSTRAINT supplier_item_rates_pkey PRIMARY KEY (id);


--
-- Name: supplier_items supplier_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_items
    ADD CONSTRAINT supplier_items_pkey PRIMARY KEY (id);


--
-- Name: supplier_payment_allocations supplier_payment_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payment_allocations
    ADD CONSTRAINT supplier_payment_allocations_pkey PRIMARY KEY (id);


--
-- Name: supplier_payments supplier_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_pkey PRIMARY KEY (id);


--
-- Name: supplier_payments supplier_payments_tenant_id_payment_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_tenant_id_payment_no_key UNIQUE (tenant_id, payment_no);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_supplier_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_supplier_code_key UNIQUE (supplier_code);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_shop_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_shop_code_key UNIQUE (shop_code);


--
-- Name: tenants tenants_subdomain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_subdomain_key UNIQUE (subdomain);


--
-- Name: user_permission_overrides user_permission_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permission_overrides
    ADD CONSTRAINT user_permission_overrides_pkey PRIMARY KEY (user_id, permission_key);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webhook_deliveries webhook_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_pkey PRIMARY KEY (id);


--
-- Name: webhook_deliveries webhook_deliveries_subscription_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_subscription_id_event_id_key UNIQUE (subscription_id, event_id);


--
-- Name: webhook_subscriptions webhook_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_subscriptions
    ADD CONSTRAINT webhook_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: audit_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_entity ON public.audit_log USING btree (tenant_id, entity, entity_id);


--
-- Name: audit_tenant_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_tenant_at ON public.audit_log USING btree (tenant_id, at DESC);


--
-- Name: error_logs_open_fp; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX error_logs_open_fp ON public.error_logs USING btree (fingerprint) WHERE ((status)::text <> 'resolved'::text);


--
-- Name: error_logs_request; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX error_logs_request ON public.error_logs USING btree (request_id);


--
-- Name: error_logs_tenant_seen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX error_logs_tenant_seen ON public.error_logs USING btree (tenant_id, last_seen_at DESC);


--
-- Name: idx_customers_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);


--
-- Name: idx_daily_rates_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_rates_date ON public.daily_rates USING btree (rate_date);


--
-- Name: idx_inventory_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_category ON public.inventory USING btree (category);


--
-- Name: idx_loans_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loans_customer ON public.loans USING btree (customer_id);


--
-- Name: idx_orders_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_created ON public.orders USING btree (created_at);


--
-- Name: idx_orders_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id);


--
-- Name: idx_payments_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_created ON public.payments USING btree (created_at);


--
-- Name: idx_payments_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_customer ON public.payments USING btree (customer_id);


--
-- Name: idx_reset_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_reset_tokens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_tokens_user ON public.password_reset_tokens USING btree (user_id);


--
-- Name: ix_advance_reversals_deposit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_advance_reversals_deposit ON public.advance_reversals USING btree (deposit_id);


--
-- Name: ix_advance_reversals_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_advance_reversals_order ON public.advance_reversals USING btree (order_id);


--
-- Name: ix_bill_lines; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bill_lines ON public.supplier_bill_lines USING btree (bill_id);


--
-- Name: ix_bill_lines_grn_line; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bill_lines_grn_line ON public.supplier_bill_lines USING btree (grn_line_id);


--
-- Name: ix_bills_supplier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bills_supplier ON public.supplier_bills USING btree (tenant_id, supplier_id, supplier_invoice_date);


--
-- Name: ix_booking_items_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_booking_items_tenant ON public.booking_items USING btree (tenant_id);


--
-- Name: ix_booking_metal_deposits_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_booking_metal_deposits_tenant ON public.booking_metal_deposits USING btree (tenant_id);


--
-- Name: ix_bookings_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bookings_tenant ON public.bookings USING btree (tenant_id);


--
-- Name: ix_buyback_items; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_buyback_items ON public.buyback_items USING btree (buyback_id);


--
-- Name: ix_buybacks_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_buybacks_date ON public.buybacks USING btree (tenant_id, buyback_date);


--
-- Name: ix_cancellation_items_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cancellation_items_tenant ON public.cancellation_items USING btree (tenant_id);


--
-- Name: ix_cancellations_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cancellations_tenant ON public.cancellations USING btree (tenant_id);


--
-- Name: ix_cash_outflows_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cash_outflows_customer ON public.cash_outflows USING btree (tenant_id, customer_id);


--
-- Name: ix_cash_outflows_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cash_outflows_date ON public.cash_outflows USING btree (tenant_id, outflow_date);


--
-- Name: ix_credit_memos_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_credit_memos_tenant ON public.credit_memos USING btree (tenant_id);


--
-- Name: ix_customer_credits_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_customer_credits_customer ON public.customer_credits USING btree (tenant_id, customer_id);


--
-- Name: ix_customer_visits; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_customer_visits ON public.customer_visits USING btree (tenant_id, customer_id, visit_date DESC);


--
-- Name: ix_customers_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_customers_tenant ON public.customers USING btree (tenant_id);


--
-- Name: ix_daily_rates_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_daily_rates_tenant ON public.daily_rates USING btree (tenant_id);


--
-- Name: ix_deposit_payments_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_deposit_payments_tenant ON public.deposit_payments USING btree (tenant_id);


--
-- Name: ix_deposits_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_deposits_tenant ON public.deposits USING btree (tenant_id);


--
-- Name: ix_document_links_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_document_links_entity ON public.document_links USING btree (tenant_id, entity_type, entity_id);


--
-- Name: ix_domain_events_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_domain_events_pending ON public.domain_events USING btree (created_at) WHERE (dispatched_at IS NULL);


--
-- Name: ix_files_sha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_files_sha ON public.files USING btree (tenant_id, sha256);


--
-- Name: ix_grn_lines; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_grn_lines ON public.goods_receipt_lines USING btree (grn_id);


--
-- Name: ix_grn_lines_grn; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_grn_lines_grn ON public.goods_receipt_lines USING btree (grn_id);


--
-- Name: ix_grn_po; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_grn_po ON public.goods_receipts USING btree (po_id);


--
-- Name: ix_grn_supplier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_grn_supplier ON public.goods_receipts USING btree (tenant_id, supplier_id, grn_date);


--
-- Name: ix_gst_2b_imports_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_gst_2b_imports_period ON public.gst_2b_imports USING btree (tenant_id, period);


--
-- Name: ix_gst_2b_lines_import; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_gst_2b_lines_import ON public.gst_2b_lines USING btree (import_id);


--
-- Name: ix_inventory_stones_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inventory_stones_item ON public.inventory_stones USING btree (item_id);


--
-- Name: ix_inventory_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inventory_tenant ON public.inventory USING btree (tenant_id);


--
-- Name: ix_inventory_txn_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inventory_txn_item ON public.inventory_transactions USING btree (tenant_id, item_id, txn_at);


--
-- Name: ix_inventory_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inventory_type ON public.inventory USING btree (tenant_id, category, sub_category);


--
-- Name: ix_item_images_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_item_images_item ON public.item_images USING btree (tenant_id, item_id) WHERE (removed_at IS NULL);


--
-- Name: ix_license_keys_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_license_keys_tenant ON public.license_keys USING btree (tenant_id);


--
-- Name: ix_loan_emi_records_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_loan_emi_records_tenant ON public.loan_emi_records USING btree (tenant_id);


--
-- Name: ix_loan_items_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_loan_items_tenant ON public.loan_items USING btree (tenant_id);


--
-- Name: ix_loan_txn_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_loan_txn_loan ON public.loan_transactions USING btree (loan_id, txn_date, id);


--
-- Name: ix_loans_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_loans_tenant ON public.loans USING btree (tenant_id);


--
-- Name: ix_metal_stock_job; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_metal_stock_job ON public.metal_stock_movements USING btree (refinery_job_id) WHERE (refinery_job_id IS NOT NULL);


--
-- Name: ix_metal_stock_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_metal_stock_status ON public.metal_stock_movements USING btree (tenant_id, status, metal);


--
-- Name: ix_old_gold_items_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_old_gold_items_tenant ON public.old_gold_items USING btree (tenant_id);


--
-- Name: ix_old_gold_payments_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_old_gold_payments_tenant ON public.old_gold_payments USING btree (tenant_id);


--
-- Name: ix_old_gold_purchases_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_old_gold_purchases_tenant ON public.old_gold_purchases USING btree (tenant_id);


--
-- Name: ix_order_items_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_order_items_tenant ON public.order_items USING btree (tenant_id);


--
-- Name: ix_orders_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_orders_tenant ON public.orders USING btree (tenant_id);


--
-- Name: ix_orders_tenant_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_orders_tenant_created ON public.orders USING btree (tenant_id, created_at);


--
-- Name: ix_outflows_register; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_outflows_register ON public.cash_outflows USING btree (register_session_id);


--
-- Name: ix_password_reset_tokens_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_password_reset_tokens_tenant ON public.password_reset_tokens USING btree (tenant_id);


--
-- Name: ix_pay_alloc_bill; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pay_alloc_bill ON public.supplier_payment_allocations USING btree (bill_id);


--
-- Name: ix_pay_alloc_payment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pay_alloc_payment ON public.supplier_payment_allocations USING btree (payment_id);


--
-- Name: ix_payment_allocations_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payment_allocations_tenant ON public.payment_allocations USING btree (tenant_id);


--
-- Name: ix_payments_allocation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payments_allocation ON public.payments USING btree (allocation_id) WHERE (allocation_id IS NOT NULL);


--
-- Name: ix_payments_deposit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payments_deposit ON public.payments USING btree (deposit_id) WHERE (deposit_id IS NOT NULL);


--
-- Name: ix_payments_ogp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payments_ogp ON public.payments USING btree (old_gold_purchase_id) WHERE (old_gold_purchase_id IS NOT NULL);


--
-- Name: ix_payments_register; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payments_register ON public.payments USING btree (register_session_id);


--
-- Name: ix_payments_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payments_tenant ON public.payments USING btree (tenant_id);


--
-- Name: ix_payments_tenant_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_payments_tenant_created ON public.payments USING btree (tenant_id, created_at);


--
-- Name: ix_po_lines; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_po_lines ON public.purchase_order_lines USING btree (po_id);


--
-- Name: ix_po_supplier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_po_supplier ON public.purchase_orders USING btree (tenant_id, supplier_id, po_date);


--
-- Name: ix_refined_metal_ledger; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_refined_metal_ledger ON public.refined_metal_ledger USING btree (tenant_id, metal, entry_date);


--
-- Name: ix_refinery_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_refinery_jobs_status ON public.refinery_jobs USING btree (tenant_id, status, metal);


--
-- Name: ix_register_sessions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_register_sessions_date ON public.register_sessions USING btree (tenant_id, business_date);


--
-- Name: ix_repair_items_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_repair_items_tenant ON public.repair_items USING btree (tenant_id);


--
-- Name: ix_repairs_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_repairs_tenant ON public.repairs USING btree (tenant_id);


--
-- Name: ix_role_permissions_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_role_permissions_tenant ON public.role_permissions USING btree (tenant_id);


--
-- Name: ix_shipments_awb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shipments_awb ON public.shipments USING btree (awb_no);


--
-- Name: ix_shop_settings_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_shop_settings_tenant ON public.shop_settings USING btree (tenant_id);


--
-- Name: ix_sp_alloc_bill; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_sp_alloc_bill ON public.supplier_payment_allocations USING btree (bill_id) WHERE (NOT voided);


--
-- Name: ix_stock_audit_counts_audit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_stock_audit_counts_audit ON public.stock_audit_counts USING btree (audit_id);


--
-- Name: ix_stock_audit_lines_audit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_stock_audit_lines_audit ON public.stock_audit_lines USING btree (audit_id);


--
-- Name: ix_stock_audit_scans_audit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_stock_audit_scans_audit ON public.stock_audit_scans USING btree (audit_id, item_id) WHERE (voided_at IS NULL);


--
-- Name: ix_stock_audits_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_stock_audits_status ON public.stock_audits USING btree (tenant_id, status);


--
-- Name: ix_supplier_item_rates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_supplier_item_rates ON public.supplier_item_rates USING btree (supplier_item_id, effective_from DESC);


--
-- Name: ix_supplier_items; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_supplier_items ON public.supplier_items USING btree (tenant_id, supplier_id);


--
-- Name: ix_suppliers_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_suppliers_tenant ON public.suppliers USING btree (tenant_id);


--
-- Name: ix_user_permission_overrides_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_permission_overrides_tenant ON public.user_permission_overrides USING btree (tenant_id);


--
-- Name: ix_user_roles_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_roles_tenant ON public.user_roles USING btree (tenant_id);


--
-- Name: ix_users_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_tenant ON public.users USING btree (tenant_id);


--
-- Name: ix_webhook_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_webhook_due ON public.webhook_deliveries USING btree (next_retry_at) WHERE ((status)::text = ANY ((ARRAY['pending'::character varying, 'failed'::character varying])::text[]));


--
-- Name: roles_system_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_system_key ON public.roles USING btree (tenant_id, system_key) WHERE (system_key IS NOT NULL);


--
-- Name: sessions_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_active ON public.sessions USING btree (user_id) WHERE (revoked_at IS NULL);


--
-- Name: supplier_bills_supplier_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX supplier_bills_supplier_idx ON public.supplier_bills USING btree (supplier_id, status);


--
-- Name: supplier_payments_supplier_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX supplier_payments_supplier_idx ON public.supplier_payments USING btree (supplier_id, status);


--
-- Name: tenants_one_default; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenants_one_default ON public.tenants USING btree (is_default) WHERE is_default;


--
-- Name: uq_daily_rates_tenant_date; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_daily_rates_tenant_date ON public.daily_rates USING btree (tenant_id, rate_date);


--
-- Name: users_one_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_one_owner ON public.users USING btree (tenant_id) WHERE is_owner;


--
-- Name: ux_customer_credits_payment; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_customer_credits_payment ON public.customer_credits USING btree (payment_id, source) WHERE (payment_id IS NOT NULL);


--
-- Name: ux_customers_external_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_customers_external_ref ON public.customers USING btree (tenant_id, external_ref) WHERE (external_ref IS NOT NULL);


--
-- Name: ux_inventory_external_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_inventory_external_ref ON public.inventory USING btree (tenant_id, external_ref) WHERE (external_ref IS NOT NULL);


--
-- Name: ux_inventory_txn_posting; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_inventory_txn_posting ON public.inventory_transactions USING btree (tenant_id, posting_ref) WHERE (posting_ref IS NOT NULL);


--
-- Name: ux_item_images_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_item_images_primary ON public.item_images USING btree (item_id) WHERE (is_primary AND (removed_at IS NULL));


--
-- Name: ux_metal_stock_posting; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_metal_stock_posting ON public.metal_stock_movements USING btree (tenant_id, posting_ref) WHERE (posting_ref IS NOT NULL);


--
-- Name: ux_orders_external_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_orders_external_ref ON public.orders USING btree (tenant_id, external_ref) WHERE (external_ref IS NOT NULL);


--
-- Name: ux_payments_external_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_payments_external_ref ON public.payments USING btree (tenant_id, external_ref) WHERE (external_ref IS NOT NULL);


--
-- Name: ux_payments_gateway; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_payments_gateway ON public.payments USING btree (tenant_id, gateway_payment_id) WHERE (gateway_payment_id IS NOT NULL);


--
-- Name: ux_register_one_open; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_register_one_open ON public.register_sessions USING btree (counter_id) WHERE ((status)::text <> 'closed'::text);


--
-- Name: ux_repairs_invoice_no; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_repairs_invoice_no ON public.repairs USING btree (tenant_id, invoice_no) WHERE (invoice_no IS NOT NULL);


--
-- Name: ux_repairs_receipt_no; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_repairs_receipt_no ON public.repairs USING btree (tenant_id, receipt_no) WHERE (receipt_no IS NOT NULL);


--
-- Name: ux_shipments_external_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_shipments_external_ref ON public.shipments USING btree (tenant_id, external_ref) WHERE (external_ref IS NOT NULL);


--
-- Name: ux_stock_audit_counts_current; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_stock_audit_counts_current ON public.stock_audit_counts USING btree (audit_id, lower((category)::text), lower((metal)::text)) WHERE (superseded_at IS NULL);


--
-- Name: ux_stock_audits_no; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_stock_audits_no ON public.stock_audits USING btree (tenant_id, audit_no);


--
-- Name: ux_supplier_invoice_no; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_supplier_invoice_no ON public.supplier_bills USING btree (tenant_id, supplier_id, upper((supplier_invoice_no)::text)) WHERE (((status)::text = 'posted'::text) AND (duplicate_override IS NULL));


--
-- Name: audit_log audit_log_immutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_log_immutable BEFORE DELETE OR UPDATE ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.kj_audit_immutable();


--
-- Name: orders kj_a_fy_order_no; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_a_fy_order_no BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.kj_fy_order_no();


--
-- Name: cancellation_items kj_cancel_relabel; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_cancel_relabel AFTER INSERT ON public.cancellation_items FOR EACH ROW EXECUTE FUNCTION public.kj_cancel_relabel();


--
-- Name: payments kj_credit_payment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_credit_payment AFTER INSERT OR UPDATE OF voided ON public.payments FOR EACH ROW EXECUTE FUNCTION public.kj_credit_payment();


--
-- Name: customers kj_customer_state; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_customer_state BEFORE INSERT OR UPDATE OF state, state_code, gst_no ON public.customers FOR EACH ROW EXECUTE FUNCTION public.kj_customer_state();


--
-- Name: bookings kj_dedupe_no; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_dedupe_no BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.kj_dedupe_doc_no('booking_no');


--
-- Name: cancellations kj_dedupe_no; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_dedupe_no BEFORE INSERT ON public.cancellations FOR EACH ROW EXECUTE FUNCTION public.kj_dedupe_doc_no('cancellation_no');


--
-- Name: credit_memos kj_dedupe_no; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_dedupe_no BEFORE INSERT ON public.credit_memos FOR EACH ROW EXECUTE FUNCTION public.kj_dedupe_doc_no('credit_memo_no');


--
-- Name: customers kj_dedupe_no; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_dedupe_no BEFORE INSERT ON public.customers FOR EACH ROW EXECUTE FUNCTION public.kj_dedupe_doc_no('customer_code');


--
-- Name: deposits kj_dedupe_no; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_dedupe_no BEFORE INSERT ON public.deposits FOR EACH ROW EXECUTE FUNCTION public.kj_dedupe_doc_no('deposit_no');


--
-- Name: loans kj_dedupe_no; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_dedupe_no BEFORE INSERT ON public.loans FOR EACH ROW EXECUTE FUNCTION public.kj_dedupe_doc_no('loan_no');


--
-- Name: old_gold_payments kj_dedupe_no; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_dedupe_no BEFORE INSERT ON public.old_gold_payments FOR EACH ROW EXECUTE FUNCTION public.kj_dedupe_doc_no('payment_no');


--
-- Name: old_gold_purchases kj_dedupe_no; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_dedupe_no BEFORE INSERT ON public.old_gold_purchases FOR EACH ROW EXECUTE FUNCTION public.kj_dedupe_doc_no('purchase_no');


--
-- Name: orders kj_dedupe_no; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_dedupe_no BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.kj_dedupe_doc_no('order_no');


--
-- Name: payments kj_dedupe_no; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_dedupe_no BEFORE INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.kj_dedupe_doc_no('payment_no');


--
-- Name: repairs kj_dedupe_no; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_dedupe_no BEFORE INSERT ON public.repairs FOR EACH ROW EXECUTE FUNCTION public.kj_dedupe_doc_no('repair_no');


--
-- Name: inventory kj_inventory_ledger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_inventory_ledger AFTER INSERT OR UPDATE OF quantity ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.kj_inventory_ledger();


--
-- Name: inventory kj_inventory_prices; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_inventory_prices BEFORE INSERT OR UPDATE OF cost_price, retail_margin_pct, wholesale_margin_pct, created_by ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.kj_inventory_prices();


--
-- Name: old_gold_purchases kj_old_gold_cancel_metal; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_old_gold_cancel_metal AFTER UPDATE OF status ON public.old_gold_purchases FOR EACH ROW EXECUTE FUNCTION public.kj_old_gold_cancel_metal();


--
-- Name: old_gold_items kj_old_gold_metal; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_old_gold_metal AFTER INSERT ON public.old_gold_items FOR EACH ROW EXECUTE FUNCTION public.kj_old_gold_to_metal_stock();


--
-- Name: old_gold_items kj_old_gold_metal_lock; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_old_gold_metal_lock BEFORE DELETE OR UPDATE ON public.old_gold_items FOR EACH ROW EXECUTE FUNCTION public.kj_old_gold_to_metal_stock();


--
-- Name: order_items kj_order_item_snapshot; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_order_item_snapshot BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.kj_order_item_snapshot();


--
-- Name: cash_outflows kj_register_attribute; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_register_attribute BEFORE INSERT ON public.cash_outflows FOR EACH ROW EXECUTE FUNCTION public.kj_register_attribute();


--
-- Name: payments kj_register_attribute; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_register_attribute BEFORE INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.kj_register_attribute();


--
-- Name: cash_outflows kj_register_change_flag; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_register_change_flag AFTER UPDATE ON public.cash_outflows FOR EACH ROW EXECUTE FUNCTION public.kj_register_change_flag();


--
-- Name: payments kj_register_change_flag; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_register_change_flag AFTER UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.kj_register_change_flag();


--
-- Name: register_entries kj_register_entries_lock; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_register_entries_lock BEFORE INSERT OR DELETE OR UPDATE ON public.register_entries FOR EACH ROW EXECUTE FUNCTION public.kj_register_child_lock();


--
-- Name: register_session_modes kj_register_modes_lock; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_register_modes_lock BEFORE INSERT OR DELETE OR UPDATE ON public.register_session_modes FOR EACH ROW EXECUTE FUNCTION public.kj_register_child_lock();


--
-- Name: register_sessions kj_register_session_lock; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_register_session_lock BEFORE DELETE OR UPDATE ON public.register_sessions FOR EACH ROW EXECUTE FUNCTION public.kj_register_session_lock();


--
-- Name: customers kj_zz_events; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_zz_events AFTER INSERT OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.kj_emit_event();


--
-- Name: daily_rates kj_zz_events; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_zz_events AFTER INSERT OR UPDATE ON public.daily_rates FOR EACH ROW EXECUTE FUNCTION public.kj_emit_event();


--
-- Name: inventory kj_zz_events; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_zz_events AFTER INSERT OR UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.kj_emit_event();


--
-- Name: orders kj_zz_events; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_zz_events AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.kj_emit_event();


--
-- Name: payments kj_zz_events; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_zz_events AFTER INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.kj_emit_event();


--
-- Name: repairs kj_zz_events; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_zz_events AFTER INSERT OR UPDATE ON public.repairs FOR EACH ROW EXECUTE FUNCTION public.kj_emit_event();


--
-- Name: shipments kj_zz_events; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kj_zz_events AFTER INSERT OR UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.kj_shipment_event();


--
-- Name: user_roles user_roles_protect_owner; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER user_roles_protect_owner BEFORE DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.kj_protect_owner_role();


--
-- Name: users users_protect_owner; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER users_protect_owner BEFORE INSERT OR DELETE OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.kj_protect_owner();


--
-- Name: advance_reversals advance_reversals_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advance_reversals
    ADD CONSTRAINT advance_reversals_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: advance_reversals advance_reversals_deposit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advance_reversals
    ADD CONSTRAINT advance_reversals_deposit_id_fkey FOREIGN KEY (deposit_id) REFERENCES public.booking_metal_deposits(id);


--
-- Name: advance_reversals advance_reversals_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advance_reversals
    ADD CONSTRAINT advance_reversals_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: advance_reversals advance_reversals_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advance_reversals
    ADD CONSTRAINT advance_reversals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: api_clients api_clients_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_clients
    ADD CONSTRAINT api_clients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: api_keys api_keys_api_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_api_client_id_fkey FOREIGN KEY (api_client_id) REFERENCES public.api_clients(id);


--
-- Name: api_keys api_keys_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: booking_items booking_items_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_items
    ADD CONSTRAINT booking_items_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: booking_items booking_items_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_items
    ADD CONSTRAINT booking_items_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id);


--
-- Name: booking_metal_deposits booking_metal_deposits_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_metal_deposits
    ADD CONSTRAINT booking_metal_deposits_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: bookings bookings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: buyback_items buyback_items_buyback_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyback_items
    ADD CONSTRAINT buyback_items_buyback_id_fkey FOREIGN KEY (buyback_id) REFERENCES public.buybacks(id);


--
-- Name: buyback_items buyback_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyback_items
    ADD CONSTRAINT buyback_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory(id);


--
-- Name: buyback_items buyback_items_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyback_items
    ADD CONSTRAINT buyback_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);


--
-- Name: buyback_items buyback_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyback_items
    ADD CONSTRAINT buyback_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: buybacks buybacks_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buybacks
    ADD CONSTRAINT buybacks_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: buybacks buybacks_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buybacks
    ADD CONSTRAINT buybacks_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: buybacks buybacks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buybacks
    ADD CONSTRAINT buybacks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: cancellation_items cancellation_items_cancellation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_items
    ADD CONSTRAINT cancellation_items_cancellation_id_fkey FOREIGN KEY (cancellation_id) REFERENCES public.cancellations(id) ON DELETE CASCADE;


--
-- Name: cancellation_items cancellation_items_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_items
    ADD CONSTRAINT cancellation_items_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id);


--
-- Name: cancellation_items cancellation_items_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_items
    ADD CONSTRAINT cancellation_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);


--
-- Name: cancellations cancellations_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellations
    ADD CONSTRAINT cancellations_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: cancellations cancellations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellations
    ADD CONSTRAINT cancellations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: cancellations cancellations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellations
    ADD CONSTRAINT cancellations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: cash_outflows cash_outflows_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_outflows
    ADD CONSTRAINT cash_outflows_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: cash_outflows cash_outflows_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_outflows
    ADD CONSTRAINT cash_outflows_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: credit_memos credit_memos_cancellation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_memos
    ADD CONSTRAINT credit_memos_cancellation_id_fkey FOREIGN KEY (cancellation_id) REFERENCES public.cancellations(id);


--
-- Name: credit_memos credit_memos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_memos
    ADD CONSTRAINT credit_memos_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: credit_memos credit_memos_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_memos
    ADD CONSTRAINT credit_memos_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: credit_memos credit_memos_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_memos
    ADD CONSTRAINT credit_memos_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: customer_credits customer_credits_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_credits
    ADD CONSTRAINT customer_credits_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customer_credits customer_credits_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_credits
    ADD CONSTRAINT customer_credits_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: customer_visits customer_visits_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_visits
    ADD CONSTRAINT customer_visits_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customer_visits customer_visits_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_visits
    ADD CONSTRAINT customer_visits_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: customers customers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: daily_rates daily_rates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_rates
    ADD CONSTRAINT daily_rates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: deposit_payments deposit_payments_deposit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposit_payments
    ADD CONSTRAINT deposit_payments_deposit_id_fkey FOREIGN KEY (deposit_id) REFERENCES public.deposits(id) ON DELETE CASCADE;


--
-- Name: deposits deposits_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: deposits deposits_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: document_links document_links_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_links
    ADD CONSTRAINT document_links_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);


--
-- Name: document_links document_links_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_links
    ADD CONSTRAINT document_links_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: domain_events domain_events_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.domain_events
    ADD CONSTRAINT domain_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: file_blobs file_blobs_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_blobs
    ADD CONSTRAINT file_blobs_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);


--
-- Name: file_blobs file_blobs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_blobs
    ADD CONSTRAINT file_blobs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: files files_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: gateway_events gateway_events_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gateway_events
    ADD CONSTRAINT gateway_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: goods_receipt_lines goods_receipt_lines_grn_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipt_lines
    ADD CONSTRAINT goods_receipt_lines_grn_id_fkey FOREIGN KEY (grn_id) REFERENCES public.goods_receipts(id);


--
-- Name: goods_receipt_lines goods_receipt_lines_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipt_lines
    ADD CONSTRAINT goods_receipt_lines_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory(id);


--
-- Name: goods_receipt_lines goods_receipt_lines_po_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipt_lines
    ADD CONSTRAINT goods_receipt_lines_po_line_id_fkey FOREIGN KEY (po_line_id) REFERENCES public.purchase_order_lines(id);


--
-- Name: goods_receipt_lines goods_receipt_lines_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipt_lines
    ADD CONSTRAINT goods_receipt_lines_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: goods_receipt_tags goods_receipt_tags_grn_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipt_tags
    ADD CONSTRAINT goods_receipt_tags_grn_line_id_fkey FOREIGN KEY (grn_line_id) REFERENCES public.goods_receipt_lines(id);


--
-- Name: goods_receipt_tags goods_receipt_tags_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipt_tags
    ADD CONSTRAINT goods_receipt_tags_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory(id);


--
-- Name: goods_receipt_tags goods_receipt_tags_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipt_tags
    ADD CONSTRAINT goods_receipt_tags_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: goods_receipts goods_receipts_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id);


--
-- Name: goods_receipts goods_receipts_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: goods_receipts goods_receipts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: gst_2b_imports gst_2b_imports_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gst_2b_imports
    ADD CONSTRAINT gst_2b_imports_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: gst_2b_lines gst_2b_lines_import_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gst_2b_lines
    ADD CONSTRAINT gst_2b_lines_import_id_fkey FOREIGN KEY (import_id) REFERENCES public.gst_2b_imports(id) ON DELETE CASCADE;


--
-- Name: gst_2b_lines gst_2b_lines_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gst_2b_lines
    ADD CONSTRAINT gst_2b_lines_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: idempotency_keys idempotency_keys_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: integration_credentials integration_credentials_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_credentials
    ADD CONSTRAINT integration_credentials_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: inventory_stones inventory_stones_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_stones
    ADD CONSTRAINT inventory_stones_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory(id);


--
-- Name: inventory_stones inventory_stones_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_stones
    ADD CONSTRAINT inventory_stones_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: inventory inventory_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: inventory_transactions inventory_transactions_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory(id);


--
-- Name: inventory_transactions inventory_transactions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: item_images item_images_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_images
    ADD CONSTRAINT item_images_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);


--
-- Name: item_images item_images_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_images
    ADD CONSTRAINT item_images_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory(id);


--
-- Name: item_images item_images_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_images
    ADD CONSTRAINT item_images_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: license_keys license_keys_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_keys
    ADD CONSTRAINT license_keys_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: licenses licenses_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: loan_emi_records loan_emi_records_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_emi_records
    ADD CONSTRAINT loan_emi_records_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE;


--
-- Name: loan_items loan_items_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_items
    ADD CONSTRAINT loan_items_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE;


--
-- Name: loan_transactions loan_transactions_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_transactions
    ADD CONSTRAINT loan_transactions_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_transactions loan_transactions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_transactions
    ADD CONSTRAINT loan_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: loans loans_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: loans loans_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: metal_stock_history metal_stock_history_movement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metal_stock_history
    ADD CONSTRAINT metal_stock_history_movement_id_fkey FOREIGN KEY (movement_id) REFERENCES public.metal_stock_movements(id);


--
-- Name: metal_stock_history metal_stock_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metal_stock_history
    ADD CONSTRAINT metal_stock_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: metal_stock_movements metal_stock_movements_refinery_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metal_stock_movements
    ADD CONSTRAINT metal_stock_movements_refinery_job_id_fkey FOREIGN KEY (refinery_job_id) REFERENCES public.refinery_jobs(id);


--
-- Name: metal_stock_movements metal_stock_movements_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metal_stock_movements
    ADD CONSTRAINT metal_stock_movements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: old_gold_items old_gold_items_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.old_gold_items
    ADD CONSTRAINT old_gold_items_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.old_gold_purchases(id) ON DELETE CASCADE;


--
-- Name: old_gold_payments old_gold_payments_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.old_gold_payments
    ADD CONSTRAINT old_gold_payments_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.old_gold_purchases(id) ON DELETE CASCADE;


--
-- Name: old_gold_purchases old_gold_purchases_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.old_gold_purchases
    ADD CONSTRAINT old_gold_purchases_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: old_gold_purchases old_gold_purchases_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.old_gold_purchases
    ADD CONSTRAINT old_gold_purchases_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_booking_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_booking_item_id_fkey FOREIGN KEY (booking_item_id) REFERENCES public.booking_items(id);


--
-- Name: order_items order_items_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: orders orders_cancellation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_cancellation_id_fkey FOREIGN KEY (cancellation_id) REFERENCES public.cancellations(id);


--
-- Name: orders orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: orders orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payment_allocations payment_allocations_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: payment_allocations payment_allocations_deposit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_deposit_id_fkey FOREIGN KEY (deposit_id) REFERENCES public.booking_metal_deposits(id);


--
-- Name: payment_allocations payment_allocations_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: payment_allocations payment_allocations_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- Name: payment_links payment_links_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_links
    ADD CONSTRAINT payment_links_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: payment_links payment_links_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_links
    ADD CONSTRAINT payment_links_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: payment_receipts payment_receipts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: payments payments_booking_deposit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_booking_deposit_id_fkey FOREIGN KEY (booking_deposit_id) REFERENCES public.booking_metal_deposits(id);


--
-- Name: payments payments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: payments payments_credit_memo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_credit_memo_id_fkey FOREIGN KEY (credit_memo_id) REFERENCES public.credit_memos(id);


--
-- Name: payments payments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: payments payments_repair_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_repair_id_fkey FOREIGN KEY (repair_id) REFERENCES public.repairs(id);


--
-- Name: purchase_order_lines purchase_order_lines_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id);


--
-- Name: purchase_order_lines purchase_order_lines_supplier_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_supplier_item_id_fkey FOREIGN KEY (supplier_item_id) REFERENCES public.supplier_items(id);


--
-- Name: purchase_order_lines purchase_order_lines_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: purchase_orders purchase_orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: refined_metal_ledger refined_metal_ledger_refinery_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refined_metal_ledger
    ADD CONSTRAINT refined_metal_ledger_refinery_job_id_fkey FOREIGN KEY (refinery_job_id) REFERENCES public.refinery_jobs(id);


--
-- Name: refined_metal_ledger refined_metal_ledger_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refined_metal_ledger
    ADD CONSTRAINT refined_metal_ledger_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: refinery_jobs refinery_jobs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refinery_jobs
    ADD CONSTRAINT refinery_jobs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: register_change_flags register_change_flags_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_change_flags
    ADD CONSTRAINT register_change_flags_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.register_sessions(id);


--
-- Name: register_change_flags register_change_flags_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_change_flags
    ADD CONSTRAINT register_change_flags_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: register_counters register_counters_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_counters
    ADD CONSTRAINT register_counters_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: register_entries register_entries_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_entries
    ADD CONSTRAINT register_entries_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.register_sessions(id);


--
-- Name: register_entries register_entries_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_entries
    ADD CONSTRAINT register_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: register_reopen_log register_reopen_log_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_reopen_log
    ADD CONSTRAINT register_reopen_log_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.register_sessions(id);


--
-- Name: register_reopen_log register_reopen_log_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_reopen_log
    ADD CONSTRAINT register_reopen_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: register_session_modes register_session_modes_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_session_modes
    ADD CONSTRAINT register_session_modes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.register_sessions(id);


--
-- Name: register_session_modes register_session_modes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_session_modes
    ADD CONSTRAINT register_session_modes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: register_session_users register_session_users_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_session_users
    ADD CONSTRAINT register_session_users_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.register_sessions(id);


--
-- Name: register_session_users register_session_users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_session_users
    ADD CONSTRAINT register_session_users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: register_sessions register_sessions_counter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_sessions
    ADD CONSTRAINT register_sessions_counter_id_fkey FOREIGN KEY (counter_id) REFERENCES public.register_counters(id);


--
-- Name: register_sessions register_sessions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_sessions
    ADD CONSTRAINT register_sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: repair_items repair_items_repair_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_items
    ADD CONSTRAINT repair_items_repair_id_fkey FOREIGN KEY (repair_id) REFERENCES public.repairs(id) ON DELETE CASCADE;


--
-- Name: repairs repairs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repairs
    ADD CONSTRAINT repairs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: repairs repairs_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repairs
    ADD CONSTRAINT repairs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: role_permissions role_permissions_permission_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_key_fkey FOREIGN KEY (permission_key) REFERENCES public.permissions(key) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: roles roles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: shipments shipments_sales_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_sales_order_id_fkey FOREIGN KEY (sales_order_id) REFERENCES public.orders(id);


--
-- Name: shipments shipments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: shop_settings_v2 shop_settings_v2_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_settings_v2
    ADD CONSTRAINT shop_settings_v2_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: stock_audit_counts stock_audit_counts_audit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audit_counts
    ADD CONSTRAINT stock_audit_counts_audit_id_fkey FOREIGN KEY (audit_id) REFERENCES public.stock_audits(id) ON DELETE CASCADE;


--
-- Name: stock_audit_counts stock_audit_counts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audit_counts
    ADD CONSTRAINT stock_audit_counts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: stock_audit_lines stock_audit_lines_audit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audit_lines
    ADD CONSTRAINT stock_audit_lines_audit_id_fkey FOREIGN KEY (audit_id) REFERENCES public.stock_audits(id) ON DELETE CASCADE;


--
-- Name: stock_audit_lines stock_audit_lines_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audit_lines
    ADD CONSTRAINT stock_audit_lines_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: stock_audit_scans stock_audit_scans_audit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audit_scans
    ADD CONSTRAINT stock_audit_scans_audit_id_fkey FOREIGN KEY (audit_id) REFERENCES public.stock_audits(id) ON DELETE CASCADE;


--
-- Name: stock_audit_scans stock_audit_scans_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audit_scans
    ADD CONSTRAINT stock_audit_scans_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: stock_audits stock_audits_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audits
    ADD CONSTRAINT stock_audits_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: supplier_bill_lines supplier_bill_lines_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_bill_lines
    ADD CONSTRAINT supplier_bill_lines_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.supplier_bills(id);


--
-- Name: supplier_bill_lines supplier_bill_lines_grn_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_bill_lines
    ADD CONSTRAINT supplier_bill_lines_grn_line_id_fkey FOREIGN KEY (grn_line_id) REFERENCES public.goods_receipt_lines(id);


--
-- Name: supplier_bill_lines supplier_bill_lines_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_bill_lines
    ADD CONSTRAINT supplier_bill_lines_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: supplier_bills supplier_bills_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_bills
    ADD CONSTRAINT supplier_bills_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: supplier_bills supplier_bills_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_bills
    ADD CONSTRAINT supplier_bills_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: supplier_item_rates supplier_item_rates_supplier_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_item_rates
    ADD CONSTRAINT supplier_item_rates_supplier_item_id_fkey FOREIGN KEY (supplier_item_id) REFERENCES public.supplier_items(id);


--
-- Name: supplier_item_rates supplier_item_rates_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_item_rates
    ADD CONSTRAINT supplier_item_rates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: supplier_items supplier_items_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_items
    ADD CONSTRAINT supplier_items_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: supplier_items supplier_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_items
    ADD CONSTRAINT supplier_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: supplier_payment_allocations supplier_payment_allocations_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payment_allocations
    ADD CONSTRAINT supplier_payment_allocations_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.supplier_bills(id);


--
-- Name: supplier_payment_allocations supplier_payment_allocations_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payment_allocations
    ADD CONSTRAINT supplier_payment_allocations_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.supplier_payments(id);


--
-- Name: supplier_payment_allocations supplier_payment_allocations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payment_allocations
    ADD CONSTRAINT supplier_payment_allocations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: supplier_payments supplier_payments_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: supplier_payments supplier_payments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: user_permission_overrides user_permission_overrides_permission_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permission_overrides
    ADD CONSTRAINT user_permission_overrides_permission_key_fkey FOREIGN KEY (permission_key) REFERENCES public.permissions(key) ON DELETE CASCADE;


--
-- Name: user_permission_overrides user_permission_overrides_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permission_overrides
    ADD CONSTRAINT user_permission_overrides_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: webhook_deliveries webhook_deliveries_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.webhook_subscriptions(id);


--
-- Name: webhook_deliveries webhook_deliveries_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: webhook_subscriptions webhook_subscriptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_subscriptions
    ADD CONSTRAINT webhook_subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: advance_reversals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.advance_reversals ENABLE ROW LEVEL SECURITY;

--
-- Name: api_clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_clients ENABLE ROW LEVEL SECURITY;

--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_metal_deposits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_metal_deposits ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: buyback_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.buyback_items ENABLE ROW LEVEL SECURITY;

--
-- Name: buybacks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.buybacks ENABLE ROW LEVEL SECURITY;

--
-- Name: cancellation_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cancellation_items ENABLE ROW LEVEL SECURITY;

--
-- Name: cancellations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cancellations ENABLE ROW LEVEL SECURITY;

--
-- Name: cash_outflows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cash_outflows ENABLE ROW LEVEL SECURITY;

--
-- Name: credit_memos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.credit_memos ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_credits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_visits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_visits ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_rates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: deposit_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deposit_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: deposits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

--
-- Name: doc_counters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.doc_counters ENABLE ROW LEVEL SECURITY;

--
-- Name: document_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;

--
-- Name: domain_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;

--
-- Name: file_blobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.file_blobs ENABLE ROW LEVEL SECURITY;

--
-- Name: files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

--
-- Name: gateway_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gateway_events ENABLE ROW LEVEL SECURITY;

--
-- Name: goods_receipt_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goods_receipt_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: goods_receipt_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goods_receipt_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: goods_receipts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;

--
-- Name: gst_2b_imports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gst_2b_imports ENABLE ROW LEVEL SECURITY;

--
-- Name: gst_2b_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gst_2b_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: idempotency_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: integration_credentials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_stones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_stones ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: item_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;

--
-- Name: advance_reversals kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.advance_reversals USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: api_clients kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.api_clients USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: api_keys kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.api_keys USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: audit_log kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.audit_log USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: booking_items kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.booking_items USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: booking_metal_deposits kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.booking_metal_deposits USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: bookings kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.bookings USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: buyback_items kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.buyback_items USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: buybacks kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.buybacks USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: cancellation_items kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.cancellation_items USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: cancellations kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.cancellations USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: cash_outflows kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.cash_outflows USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: credit_memos kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.credit_memos USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: customer_credits kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.customer_credits USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: customer_visits kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.customer_visits USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: customers kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.customers USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: daily_rates kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.daily_rates USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: deposit_payments kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.deposit_payments USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: deposits kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.deposits USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: doc_counters kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.doc_counters USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: document_links kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.document_links USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: domain_events kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.domain_events USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: file_blobs kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.file_blobs USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: files kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.files USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: gateway_events kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.gateway_events USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: goods_receipt_lines kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.goods_receipt_lines USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: goods_receipt_tags kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.goods_receipt_tags USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: goods_receipts kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.goods_receipts USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: gst_2b_imports kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.gst_2b_imports USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: gst_2b_lines kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.gst_2b_lines USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: idempotency_keys kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.idempotency_keys USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: integration_credentials kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.integration_credentials USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: inventory kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.inventory USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: inventory_stones kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.inventory_stones USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: inventory_transactions kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.inventory_transactions USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: item_images kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.item_images USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: license_keys kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.license_keys USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: licenses kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.licenses USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: loan_emi_records kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.loan_emi_records USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: loan_items kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.loan_items USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: loan_transactions kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.loan_transactions USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: loans kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.loans USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: metal_stock_history kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.metal_stock_history USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: metal_stock_movements kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.metal_stock_movements USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: old_gold_items kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.old_gold_items USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: old_gold_payments kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.old_gold_payments USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: old_gold_purchases kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.old_gold_purchases USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: order_items kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.order_items USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: orders kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.orders USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: password_reset_tokens kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.password_reset_tokens USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: payment_allocations kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.payment_allocations USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: payment_links kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.payment_links USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: payment_receipts kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.payment_receipts USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: payments kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.payments USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: purchase_order_lines kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.purchase_order_lines USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: purchase_orders kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.purchase_orders USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: refined_metal_ledger kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.refined_metal_ledger USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: refinery_jobs kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.refinery_jobs USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: register_change_flags kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.register_change_flags USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: register_counters kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.register_counters USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: register_entries kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.register_entries USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: register_reopen_log kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.register_reopen_log USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: register_session_modes kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.register_session_modes USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: register_session_users kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.register_session_users USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: register_sessions kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.register_sessions USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: repair_items kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.repair_items USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: repairs kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.repairs USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: role_permissions kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.role_permissions USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: roles kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.roles USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: sessions kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.sessions USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: shipments kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.shipments USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: shop_settings kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.shop_settings USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: shop_settings_v2 kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.shop_settings_v2 USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: stock_audit_counts kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.stock_audit_counts USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: stock_audit_lines kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.stock_audit_lines USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: stock_audit_scans kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.stock_audit_scans USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: stock_audits kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.stock_audits USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: supplier_bill_lines kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.supplier_bill_lines USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: supplier_bills kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.supplier_bills USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: supplier_item_rates kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.supplier_item_rates USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: supplier_items kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.supplier_items USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: supplier_payment_allocations kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.supplier_payment_allocations USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: supplier_payments kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.supplier_payments USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: suppliers kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.suppliers USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: user_permission_overrides kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.user_permission_overrides USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: user_roles kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.user_roles USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: users kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.users USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: webhook_deliveries kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.webhook_deliveries USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: webhook_subscriptions kj_tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kj_tenant_isolation ON public.webhook_subscriptions USING ((tenant_id = public.kj_current_tenant())) WITH CHECK ((tenant_id = public.kj_current_tenant()));


--
-- Name: license_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: licenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_emi_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_emi_records ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_items ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: loans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

--
-- Name: metal_stock_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.metal_stock_history ENABLE ROW LEVEL SECURITY;

--
-- Name: metal_stock_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.metal_stock_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: old_gold_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.old_gold_items ENABLE ROW LEVEL SECURITY;

--
-- Name: old_gold_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.old_gold_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: old_gold_purchases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.old_gold_purchases ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: password_reset_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_allocations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_receipts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_order_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: refined_metal_ledger; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.refined_metal_ledger ENABLE ROW LEVEL SECURITY;

--
-- Name: refinery_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.refinery_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: register_change_flags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.register_change_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: register_counters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.register_counters ENABLE ROW LEVEL SECURITY;

--
-- Name: register_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.register_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: register_reopen_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.register_reopen_log ENABLE ROW LEVEL SECURITY;

--
-- Name: register_session_modes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.register_session_modes ENABLE ROW LEVEL SECURITY;

--
-- Name: register_session_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.register_session_users ENABLE ROW LEVEL SECURITY;

--
-- Name: register_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.register_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: repair_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.repair_items ENABLE ROW LEVEL SECURITY;

--
-- Name: repairs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: shipments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

--
-- Name: shop_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: shop_settings_v2; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shop_settings_v2 ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_audit_counts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_audit_counts ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_audit_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_audit_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_audit_scans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_audit_scans ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_audits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_audits ENABLE ROW LEVEL SECURITY;

--
-- Name: supplier_bill_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supplier_bill_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: supplier_bills; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supplier_bills ENABLE ROW LEVEL SECURITY;

--
-- Name: supplier_item_rates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supplier_item_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: supplier_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supplier_items ENABLE ROW LEVEL SECURITY;

--
-- Name: supplier_payment_allocations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supplier_payment_allocations ENABLE ROW LEVEL SECURITY;

--
-- Name: supplier_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: user_permission_overrides; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: webhook_deliveries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

--
-- Name: webhook_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict eOJa0RfQ3fAlwrE9iNbw490nlnskT5k8zyIRKfN8xUkd3RhiRcb9RnPMGBXbcxw

