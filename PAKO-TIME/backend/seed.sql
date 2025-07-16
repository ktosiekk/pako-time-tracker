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
  ('Przerwa'),
  ('CZYNNOŚCI DODATKOWE'),
  ('SPECJALIŚCI'),
  ('AWARIA'),
  ('INWENTARYZACJA');

-- Example subcategories
INSERT INTO subcategories (category_id, name) VALUES
  (1, 'Wiszące'),
  (1, 'Koszule'),
  (1, 'Karton'),
  (1, 'Buty'),
  (1, 'Zagranica'),
  (2, 'Grupówka'),
  (2, 'Jednorazy'),
  (2, '002'),
  (2, '030'),
  (2, 'Zagranica'),
  (3, 'Pakowanie www'),
  (4, 'Zwroty002'),
  (4, 'Zwroty zagranica'),
  (4, 'Zwroty www'),
  (4, 'Lokowanie zwrotów'),
  (5, 'Przerwa'),
  (6, 'Przeklejanie cen'),
  (6, 'Wywieszanie na wieszaki'),
  (6, 'Pomoc biuro'),
  (6, 'Porządki'),
  (6, 'Targi/ eventy'),
  (6, 'Transport'),
  (6, 'Inne'),
  (6, 'Spotknia/ zebrania'),
  (6, 'Liczenie dostawy'),
  (6, 'Rozładunek auta'),
  (7, 'Specjaliści'),
  (8, 'Awaria'),
  (9, 'Wiszące'),
  (9, 'Skrzynki'),
  (9, 'Karton'),
  (9, 'Audyt');