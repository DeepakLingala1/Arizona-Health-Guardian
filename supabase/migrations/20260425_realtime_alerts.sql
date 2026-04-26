-- Enable Realtime on the alerts table so public users see analyst-approved
-- alerts the instant they transition out of 'pending'. REPLICA IDENTITY FULL
-- is required so the payload contains both old + new rows (lets clients
-- detect a status transition rather than just a final state).

ALTER TABLE public.alerts REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'alerts'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts';
  END IF;
END $$;
