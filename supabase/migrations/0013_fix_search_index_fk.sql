-- Remove the restrictive foreign key constraint on the search index outbox.
-- It was causing deletes on `vehicles` to fail because the `search_index_jobs`
-- trigger was trying to insert a reference to a vehicle that was just deleted.

alter table public.search_index_jobs drop constraint if exists search_index_jobs_vehicle_id_fkey;
