CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  rate_key text PRIMARY KEY,
  request_count integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct access to API rate limits"
  ON public.api_rate_limits FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.consume_api_rate_limit(
  p_rate_key text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS TABLE(allowed boolean, remaining integer, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_count integer;
  current_window timestamptz;
BEGIN
  IF p_rate_key IS NULL OR length(p_rate_key) = 0 OR length(p_rate_key) > 255
     OR p_max_requests < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;

  INSERT INTO public.api_rate_limits(rate_key, request_count, window_started_at, updated_at)
  VALUES (p_rate_key, 1, now(), now())
  ON CONFLICT (rate_key) DO UPDATE SET
    request_count = CASE
      WHEN public.api_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= now() THEN 1
      ELSE public.api_rate_limits.request_count + 1
    END,
    window_started_at = CASE
      WHEN public.api_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= now() THEN now()
      ELSE public.api_rate_limits.window_started_at
    END,
    updated_at = now()
  RETURNING public.api_rate_limits.request_count, public.api_rate_limits.window_started_at
  INTO current_count, current_window;

  RETURN QUERY SELECT
    current_count <= p_max_requests,
    greatest(p_max_requests - current_count, 0),
    current_window + make_interval(secs => p_window_seconds);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_api_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(text, integer, integer) TO anon, authenticated;
