-- RBAC Roles already exist in the database from a previous partial run.

-- Function to get admin dashboard metrics
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
        'pendingVendors', (SELECT count(*) FROM organizations WHERE status = 'pending'),
        'totalVendors', (SELECT count(*) FROM organizations),
        'suspendedVendors', (SELECT count(*) FROM organizations WHERE status = 'suspended'),
        'pendingListings', (SELECT count(*) FROM vehicles WHERE status = 'pending'),
        'totalListings', (SELECT count(*) FROM vehicles),
        'suspendedListings', (SELECT count(*) FROM vehicles WHERE status = 'suspended'),
        'openFraudFlags', (SELECT count(*) FROM fraud_flags WHERE status = 'open'),
        'totalFraudFlags', (SELECT count(*) FROM fraud_flags),
        'newFraudFlagsToday', (SELECT count(*) FROM fraud_flags WHERE created_at >= today),
        'failedWebhooks', (SELECT count(*) FROM stripe_webhook_events WHERE processing_status = 'failed'),
        'totalWebhooks', (SELECT count(*) FROM stripe_webhook_events),
        'webhooksLast24h', (SELECT count(*) FROM stripe_webhook_events WHERE processed_at >= yesterday),
        'totalLeads', (SELECT count(*) FROM leads),
        'leadsToday', (SELECT count(*) FROM leads WHERE created_at >= today),
        'totalReviews', (SELECT count(*) FROM reviews),
        'pendingReviews', (SELECT count(*) FROM reviews WHERE status = 'pending'),
        'activeSubscriptions', (SELECT count(*) FROM subscriptions WHERE status = 'active'),
        'pastDueSubscriptions', (SELECT count(*) FROM subscriptions WHERE status = 'past_due'),
        'revenueEstimate', (
            SELECT COALESCE(SUM(
                CASE plan_code
                    WHEN 'starter' THEN 49
                    WHEN 'growth' THEN 149
                    WHEN 'pro' THEN 399
                    WHEN 'business' THEN 999
                    WHEN 'enterprise' THEN 2499
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

-- Function to get historical analytics
CREATE OR REPLACE FUNCTION get_historical_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    leads_data json;
    revenue_data json;
    days text[] := ARRAY['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    months text[] := ARRAY['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    current_m int := extract(month from now());
    current_y int := extract(year from now());
BEGIN
    -- Leads Data (Last 7 Days)
    SELECT json_agg(day_data) INTO leads_data
    FROM (
        SELECT 
            days[extract(dow from d.date)::int + 1] as label,
            (SELECT count(*) FROM leads WHERE created_at >= d.date AND created_at < d.date + interval '1 day') as value
        FROM (
            SELECT date_trunc('day', now()) - (i || ' days')::interval as date
            FROM generate_series(6, 0, -1) as i
        ) d
    ) day_data;

    -- Revenue Data (YTD)
    SELECT COALESCE(json_agg(month_data), '[]'::json) INTO revenue_data
    FROM (
        SELECT 
            months[m] as label,
            (
                SELECT COALESCE(SUM(
                    CASE plan_code
                        WHEN 'starter' THEN 49
                        WHEN 'growth' THEN 149
                        WHEN 'pro' THEN 399
                        WHEN 'business' THEN 999
                        WHEN 'enterprise' THEN 2499
                        ELSE 0
                    END
                ), 0)
                FROM subscriptions
                WHERE status = 'active' 
                AND (extract(year from created_at) < current_y OR extract(month from created_at) <= m)
            ) as value
        FROM generate_series(
            GREATEST(1, current_m - 5), -- Ensure at least 6 months
            current_m
        ) as m
    ) month_data;

    SELECT json_build_object(
        'leadsData', leads_data,
        'revenueData', revenue_data
    ) INTO result;

    RETURN result;
END;
$$;
