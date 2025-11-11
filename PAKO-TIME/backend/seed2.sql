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
  ('MSTAWIANY', 'Michał', 'Stawiany'),
  ('ABANDOS', 'Artur', 'Bandos'),
  ('MBAROCHA', 'Małgorzata', 'Barocha'),
  ('MDYLEWSKI', 'Mateusz', 'Dylewski'),
  ('MGAJ', 'Mateusz', 'Gaj'),
  ('DKARPINSKI', 'Dawid', 'Karpiński'),
  ('NKIELBIK', 'Natalia', 'Kiełbik'),
  ('ZKOCIOLEK', 'Żaneta', 'Kociołek'),
  ('DMARCZAK', 'Daniel', 'Marczak'),
  ('MMARTYNENKO', 'Melyzaveta', 'Martynenko'),
  ('JMLYNARCZYK', 'Jolanta', 'Młynarczyk'),
  ('AMOSZKOWICZ', 'Anna', 'Moszkowicz'),
  ('HNIEPSUJ', 'Hubert', 'Niepsuj'),
  ('NPABIAN', 'Natalia', 'Pabian'),
  ('PWIERZBICKI', 'Patryk', 'Wierzbicki'),
  ('DZDYP', 'Dominik', 'Zdyp'),
  ('NZIECIK', 'Natalia', 'Zięcik'),
  ('FDRZAZGA', 'Filip', 'Drzazga'),
  ('KDRZAZGA', 'Kacper', 'Drzazga'),
  ('SSTELMASZCZYK', 'Stanisław', 'Stelmaszczyk'),
  ('DZIMON', 'Dominik', 'Zimoń'),
  ('MWIERZBICKI', 'Mateusz', 'Wierzbicki'),
  ('MBRZOZOWSKI', 'Marcin', 'Brzozowski'),
  ('LFRANCZAK', 'Łukasz', 'Franczak'),
  ('BJONCZYK', 'Bartosz', 'Jończyk'),
  ('KWOZNIAK', 'Krzysztof', 'Woźniak'),
  ('WKUNA', 'Wiktoria', 'Kuna'),
  ('DZDYB', 'Dominik', 'Zdyb'),
  ('PPANASIUK', 'Patrycja', 'Panasiuk'),
  ('SZKOLENIE1', 'SZKOLENIE1', 'SZKOLENIE1'),
  ('SZKOLENIE2', 'SZKOLENIE2', 'SZKOLENIE2'),
  ('SZKOLENIE3', 'SZKOLENIE3', 'SZKOLENIE3'),
  ('TNITKA', 'Tomasz', 'Nitka'),
  ('PPESZKA', 'Skaner', 'Uniwersalny'),
  ('TZAJAC', 'Tomasz', 'Zając'),
  ('AKIELBIK', 'Alicja', 'Kiełbik'),
  ('JKLUKOWSKI', 'Jan', 'Klukowski');

-- Categories
INSERT INTO categories (name) VALUES
  ('PRZYJĘCIE DOSTAWY'),
  ('KOMPLETACJA'),
  ('PAKOWANIE'),
  ('ZWROTY'),
  ('JAKOŚĆ'),
  ('CZYNNOŚCI DODATKOWE'),
  ('SPECJALIŚCI'),
  ('PRZERWA'),
  ('AWARIA'),
  ('INWENTARYZACJA'),
  ('MAGAZYN DODATKI');

-- Subcategories
INSERT INTO subcategories (category_id, name) VALUES
  -- PRZYJĘCIE DOSTAWY (1)
  (1, 'WISZĄCE'),
  (1, 'KOSZULE'),
  (1, 'KARTON'),
  (1, 'BUTY'),
  
  -- KOMPLETACJA (2)
  (2, 'GRUPÓWKA'),
  (2, 'JEDNORAZY'),
  (2, '002'),
  (2, '030'),
  (2, 'ZAGRANICA'),
  
  -- PAKOWANIE (3)
  (3, 'PAKOWANIE WWW'),
  
  -- ZWROTY (4)
  (4, 'ZWROTY002'),
  (4, 'ZWROTY ZAGRANICA'),
  (4, 'ZWROTY WWW'),
  (4, 'TARGI/EVENTY/SESJE'),
  
  -- JAKOŚĆ (5)
  (5, 'KONTROLA JAKOŚCI'),
  (5, 'KONTROLA ZAGRANICA'),
  (5, 'CZYSZCZENIE LOKACJI'),
  (5, 'DEFEKTY'),
  (5, 'PRZEMIESZCZENIA'),
  
  -- CZYNNOŚCI DODATKOWE (6)
  (6, 'PRZEKLEJANIE CEN'),
  (6, 'WYWIESZANIE NA WIESZAKI'),
  (6, 'POMOC BIURO'),
  (6, 'PORZĄDKI'),
  (6, 'TARGI/ EVENTY'),
  (6, 'TRANSPORT'),
  (6, 'INNE'),
  (6, 'SPOTKNIA/ ZEBRANIA'),
  (6, 'LICZENIE DOSTAWY'),
  (6, 'ROZŁADUNEK AUTA'),
  (6, 'KONTROLA ZAGRANICA'),
  (6, 'TRENER'),
  
  -- SPECJALIŚCI (7)
  (7, 'SPECJALIŚCI'),
  
  -- PRZERWA (8)
  (8, 'PRZERWA'),
  
  -- AWARIA (9)
  (9, 'AWARIA'),
  
  -- INWENTARYZACJA (10)
  (10, 'WISZĄCE'),
  (10, 'SKRZYNKI'),
  (10, 'KARTON'),
  (10, 'AUDYT'),

  -- MAGAZYN DODATKI (11)
  (11, 'PRZYJĘCIE TOWARU'),
  (11, 'KOMPLETACJA'),
  (11, 'ZAŁADUNEK'),
  (11, 'INWENTARYZACJA'),
  (11, 'PORZĄDKI');
