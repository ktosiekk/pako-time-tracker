-- Insert initial users for authentication
INSERT INTO users (id, name, surname) VALUES
  ('PAK001', 'Anna', 'Nowak'),
  ('PAK002', 'Jan', 'Kowalski'),
  ('PAK003', 'Maria', 'Wiśniewska');

-- Example categories
INSERT INTO categories (name) VALUES
  ('PRZYJĘCIE DOSTAWY'),
  ('KOMPLETACJA'),
  ('PAKOWANIE'),
  ('ZWROTY');

-- Example subcategories
INSERT INTO subcategories (category_id, name) VALUES
  (1, 'wiszące'),
  (1, 'koszule'),
  (1, 'karton'),
  (1, 'buty'),
  (1, 'zagranica'),
  (2, 'grupówka'),
  (2, 'jednorazy'),
  (2, '002'),
  (2, '030'),
  (2, 'zagranica'),
  (3, 'pakowanie www'),
  (4, 'zwroty002'),
  (4, 'zwroty zagranica'),
  (4, 'zwroty www'),
  (4, 'lokowanie zwrotów');
