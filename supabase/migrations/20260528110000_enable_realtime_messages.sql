-- Enable Realtime for the messages table so clients can subscribe to inserts
alter publication supabase_realtime add table public.messages;
