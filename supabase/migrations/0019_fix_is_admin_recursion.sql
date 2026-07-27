-- Fix infinite recursion caused by is_admin being SECURITY INVOKER
ALTER FUNCTION public.is_admin() SECURITY DEFINER;
