BEGIN;

-- Resolve PostGIS functions and types before and after the provider moves them.
ALTER FUNCTION public.search_properties_in_radius(double precision, double precision, double precision)
  SET search_path = public, extensions;

COMMIT;
