-- Function to get daily registrations for the last N days
CREATE OR REPLACE FUNCTION get_daily_registrations(days INT)
RETURNS TABLE(date TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(created_at, 'Mon DD') as date,
    COUNT(*) as count
  FROM users
  WHERE created_at >= NOW() - (days || ' days')::INTERVAL
  GROUP BY TO_CHAR(created_at, 'Mon DD'), DATE(created_at)
  ORDER BY DATE(created_at);
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly revenue for the last N months
CREATE OR REPLACE FUNCTION get_monthly_revenue(months INT)
RETURNS TABLE(month TEXT, revenue NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(created_at, 'Mon') as month,
    COALESCE(SUM(amount), 0) as revenue
  FROM payments
  WHERE created_at >= NOW() - (months || ' months')::INTERVAL
  GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
  ORDER BY DATE_TRUNC('month', created_at);
END;
$$ LANGUAGE plpgsql;

-- Function to get popular tests based on attempts
CREATE OR REPLACE FUNCTION get_popular_tests(limit_count INT)
RETURNS TABLE(name TEXT, attempts BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.title as name,
    COUNT(ta.id) as attempts
  FROM tests t
  JOIN test_attempts ta ON t.id = ta.test_id
  GROUP BY t.id, t.title
  ORDER BY attempts DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
