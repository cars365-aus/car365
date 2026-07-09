-- Fix hardcoded plan prices in dashboard metric functions.
-- Previous values were placeholder estimates and did not match the actual
-- pricing page shown to customers:
--   Starter  → $0/mo  (free tier)
--   Growth   → $49/mo
--   Pro      → $99/mo
--   Business / Enterprise are contact-sales; kept at $0 until real prices confirmed.

CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    today timestamp := date_trunc('day', now());
    yesterday timestamp := now() - interval '24 hours';
BEGIN
    SELECT json_build_object(
        'pendingVendors',       (SELECT count(*) FROM organizations WHERE status = 'pending'),
        'totalVendors',         (SELECT count(*) FROM organizations),
        'suspendedVendors',     (SELECT count(*) FROM organizations WHERE status = 'suspended'),
        'pendingListings',      (SELECT count(*) FROM vehicles WHERE status = 'pending'),
        'totalListings',        (SELECT count(*) FROM vehicles),
        'suspendedListings',    (SELECT count(*) FROM vehicles WHERE status = 'suspended'),
        'openFraudFlags',       (SELECT count(*) FROM fraud_flags WHERE status = 'open'),
        'totalFraudFlags',      (SELECT count(*) FROM fraud_flags),
        'newFraudFlagsToday',   (SELECT count(*) FROM fraud_flags WHERE created_at >= today),
        'failedWebhooks',       (SELECT count(*) FROM stripe_webhook_events WHERE processing_status = 'failed'),
        'totalWebhooks',        (SELECT count(*) FROM stripe_webhook_events),
        'webhooksLast24h',      (SELECT count(*) FROM stripe_webhook_events WHERE processed_at >= yesterday),
        'totalLeads',           (SELECT count(*) FROM leads),
        'leadsToday',           (SELECT count(*) FROM leads WHERE created_at >= today),
        'totalReviews',         (SELECT count(*) FROM reviews),
        'pendingReviews',       (SELECT count(*) FROM reviews WHERE status = 'pending'),
        'activeSubscriptions',  (SELECT count(*) FROM subscriptions WHERE status = 'active'),
        'pastDueSubscriptions', (SELECT count(*) FROM subscriptions WHERE status = 'past_due'),
        -- Annual run rate = sum of monthly prices × 12, for active subscriptions only.
        -- Prices match the public pricing page (AUD/month):
        --   starter = $0, growth = $49, pro = $99
        --   business / enterprise = contact-sales (excluded until confirmed)
        'revenueEstimate', (
            SELECT COALESCE(SUM(
                CASE plan_code
                    WHEN 'starter'    THEN 0
                    WHEN 'growth'     THEN 49
                    WHEN 'pro'        THEN 99
                    WHEN 'business'   THEN 0   -- contact-sales, price unconfirmed
                    WHEN 'enterprise' THEN 0   -- contact-sales, price unconfirmed
                    ELSE 0
                END
            ), 0) * 12
            FROM subscriptions
            WHERE status = 'active'
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- Also fix the YTD revenue chart to use the same corrected prices.
CREATE OR REPLACE FUNCTION get_historical_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    leads_data json;
    revenue_data json;
    days   text[] := ARRAY['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    months text[] := ARRAY['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    current_m int := extract(month from now());
    current_y int := extract(year from now());
BEGIN
    -- Leads Data (Last 7 Days)
    SELECT json_agg(day_data) INTO leads_data
    FROM (
        SELECT
            days[extract(dow from d.date)::int + 1] AS label,
            (SELECT count(*) FROM leads
             WHERE created_at >= d.date AND created_at < d.date + interval '1 day') AS value
        FROM (
            SELECT date_trunc('day', now()) - (i || ' days')::interval AS date
            FROM generate_series(6, 0, -1) AS i
        ) d
    ) day_data;

    -- Revenue Data (YTD) — uses corrected monthly prices
    SELECT COALESCE(json_agg(month_data), '[]'::json) INTO revenue_data
    FROM (
        SELECT
            months[m] AS label,
            (
                SELECT COALESCE(SUM(
                    CASE plan_code
                        WHEN 'starter'    THEN 0
                        WHEN 'growth'     THEN 49
                        WHEN 'pro'        THEN 99
                        WHEN 'business'   THEN 0
                        WHEN 'enterprise' THEN 0
                        ELSE 0
                    END
                ), 0)
                FROM subscriptions
                WHERE status = 'active'
                  AND (
                      extract(year  from created_at) < current_y
                      OR extract(month from created_at) <= m
                  )
            ) AS value
        FROM generate_series(
            GREATEST(1, current_m - 5),  -- show up to 6 months
            current_m
        ) AS m
    ) month_data;

    SELECT json_build_object(
        'leadsData',   leads_data,
        'revenueData', revenue_data
    ) INTO result;

    RETURN result;
END;
$$;
