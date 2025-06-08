-- Clean tables before seeding to avoid duplicates
DELETE FROM tracking;
DELETE FROM subcategories;
DELETE FROM categories;
DELETE FROM users;

ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE subcategories_id_seq RESTART WITH 1;

-- Insert initial users for authentication
INSERT INTO users (id, name, surname) VALUES
  ('PAK001', 'Anna', 'Nowak'),
  ('PAK002', 'Jan', 'Kowalski'),
  ('PAK003', 'Maria', 'Wiśniewska'),
  ('JMOTYLSKA', 'Justyna', 'Motylska'),
  ('ANOWICKA', 'Anita', 'Nowicka'),
  ('PKUNA', 'Piotr', 'Kuna'),
  ('KZIECIK', 'Klaudia', 'Zięcik'),
  ('MSTAWIANY', 'Michał', 'Stawiany');


-- Example categories
INSERT INTO categories (name) VALUES
  ('PRZYJĘCIE DOSTAWY'),
  ('KOMPLETACJA'),
  ('PAKOWANIE'),
  ('ZWROTY'),
  ('Przerwa');

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
  (4, 'lokowanie zwrotów'),
  (5, 'Przerwa');
