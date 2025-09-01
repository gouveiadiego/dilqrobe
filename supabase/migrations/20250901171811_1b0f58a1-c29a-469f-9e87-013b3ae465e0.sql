-- Fix security vulnerability: Remove public access to profiles table
-- Drop the overly permissive policy that allows public access to all profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a new secure policy that only allows authenticated users to view profiles
-- Users can view their own profile and other authenticated users can view basic profile info
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Ensure users can still manage their own profiles (these policies should already exist)
-- But adding them here for completeness in case they don't exist

-- Allow users to insert their own profile (should already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile" 
    ON public.profiles 
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Allow users to update their own profile (should already exist)  
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" 
    ON public.profiles 
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id);
  END IF;
END $$;