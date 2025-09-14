-- Insert sample houses
INSERT INTO public.houses (name, color) VALUES
  ('Red Dragons', '#ef4444'),
  ('Blue Eagles', '#3b82f6'),
  ('Green Wolves', '#22c55e'),
  ('Yellow Lions', '#eab308')
ON CONFLICT (name) DO NOTHING;

-- Insert sample sports
INSERT INTO public.sports (name, category, max_participants_per_house, points_first, points_second, points_third) VALUES
  ('100m Sprint', 'Track', 2, 10, 7, 5),
  ('200m Sprint', 'Track', 2, 10, 7, 5),
  ('Long Jump', 'Field', 2, 10, 7, 5),
  ('High Jump', 'Field', 2, 10, 7, 5),
  ('Shot Put', 'Field', 2, 10, 7, 5),
  ('Relay 4x100m', 'Track', 1, 15, 10, 7),
  ('Tug of War', 'Team', 1, 15, 10, 7),
  ('Football', 'Team', 1, 20, 15, 10)
ON CONFLICT DO NOTHING;
