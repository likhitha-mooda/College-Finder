CREATE SCHEMA IF NOT EXISTS extensions;
DROP INDEX IF EXISTS public.colleges_name_trgm_idx;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
CREATE INDEX colleges_name_trgm_idx ON public.colleges USING gin (name extensions.gin_trgm_ops);