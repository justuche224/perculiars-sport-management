-- Function to increment house points
CREATE OR REPLACE FUNCTION increment_house_points(house_id UUID, points INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE houses 
  SET total_points = total_points + points,
      updated_at = NOW()
  WHERE id = house_id;
END;
$$ LANGUAGE plpgsql;
