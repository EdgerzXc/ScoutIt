-- 1. Create a function to search properties within a radius
create or replace function search_properties_in_radius(
  search_lng double precision,
  search_lat double precision,
  radius_km double precision
)
returns setof properties
language sql
as $$
  select *
  from properties
  where coordinates is not null 
  and st_dwithin(
    coordinates,
    st_point(search_lng, search_lat)::geography,
    radius_km * 1000 -- Convert kilometers to meters (PostGIS uses meters for geography)
  );
$$;

-- 2. Allow public access to the RPC function
grant execute on function search_properties_in_radius to public;
grant execute on function search_properties_in_radius to anon;
grant execute on function search_properties_in_radius to authenticated;
