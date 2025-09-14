-- Create admin user profile for existing users who don't have profiles
-- This is a one-time script to fix existing users

DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through auth.users who don't have profiles
    FOR user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        -- Insert profile for each user without one
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
            user_record.id,
            user_record.email,
            COALESCE(user_record.raw_user_meta_data ->> 'full_name', split_part(user_record.email, '@', 1)),
            'admin' -- Make the first user admin, others can be changed later
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created profile for user: %', user_record.email;
    END LOOP;
END $$;
