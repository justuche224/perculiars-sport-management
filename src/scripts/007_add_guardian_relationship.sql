-- Add guardian relationship to participants table
-- First, add a guardian_id column that references profiles table
ALTER TABLE public.participants
ADD COLUMN IF NOT EXISTS guardian_id UUID REFERENCES public.profiles(id);

-- Create an index for better performance on guardian_id
CREATE INDEX IF NOT EXISTS idx_participants_guardian_id ON public.participants(guardian_id);

-- Update RLS policies for participants to allow guardians to view their children's data
CREATE POLICY "Guardians can view their participants" ON public.participants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'parent' AND id = participants.guardian_id
  )
);

-- Add policy for guardians to update their participants' data
CREATE POLICY "Guardians can update their participants" ON public.participants FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'parent' AND id = participants.guardian_id
  )
);

-- Add policy for guardians to insert participants (for their children)
CREATE POLICY "Guardians can insert their participants" ON public.participants FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'parent' AND id = guardian_id
  )
);
