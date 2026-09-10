-- Seed the "Ближайшие группы" schedule with the live it-academy.uz groups.
-- Content scraped verbatim from the production site (2026-06-18) so the beta
-- cards match it (branch + day pills + time + duration + full description).
-- Apply on the beta DB:  mysql <db> < server/sql/seed_schedule.sql
-- NOTE: this REPLACES existing schedule rows. Drop the DELETE if you want to keep them.

DELETE FROM schedule_items;

INSERT INTO schedule_items
  (branch, course, days, time_from, time_to, start_date, duration_months, discount, description_ru, sort_order, is_published)
VALUES
  ('yunusabad', 'Графический Дизайн', 'Вт, Сб', '17:00', '19:00', NULL, 4, NULL,
   'На курсе вы освоите сразу 3 направления: графический дизайн, моушн-дизайн и веб-дизайн.\n\nИнструменты:\nPhotoshop, Figma, Illustrator, Canva, After Effects\n\nОбучение проходит с упором на практику — уже во время занятий вы начнете создавать собственные дизайны и формировать портфолио.',
   10, 1),

  ('yunusabad', 'Python (Backend)', 'Вт, Чт', '17:00', '19:00', NULL, 8, NULL,
   'На курсе вы изучите SQL, Django, API и серверы, Git, Telegram-ботов и, главное, язык Python.\n\nЗвучит сложно? Нет! Если проходить всё постепенно, то за 8 месяцев вы полноценно освоите направление backend-разработки и будете разбираться в одном из самых сложных направлений.\n\nДелайте уверенные шаги, а IT Academy вас поддержит!',
   20, 1),

  ('yunusabad', 'Компьютерная грамотность (Word, Excel)', 'Вт, Чт', '15:00', '17:00', '2026-04-21', 2, NULL,
   'Курс подойдет тем, кто хочет уверенно пользоваться компьютером в учебе и работе.\n\nВы научитесь работать с документами в Word, создавать и оформлять таблицы в Excel, а также освоите основные функции и инструменты, которые ежедневно используются в офисной и учебной среде.',
   30, 1),

  ('yunusabad', 'Детские курсы (Unity, Roblox, программирование)', 'Вт, Сб', NULL, NULL, NULL, 6, NULL,
   'На курсе дети в увлекательной форме изучают Unity, Roblox и основы программирования.\n\nРебёнок не просто играет, а учится создавать собственные игры, развивает логическое мышление, креативность и умение решать задачи.\n\nЗанятия проходят с упором на практику и адаптированы под возраст, чтобы обучение было понятным и интересным.',
   40, 1);
