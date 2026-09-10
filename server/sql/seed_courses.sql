-- Seed the `courses` table with the 5 courses shown on the live /courses page.
-- Idempotent: re-running refreshes titles/summaries without duplicating (slug is UNIQUE).
-- Apply on beta the same way as leads.sql (phpMyAdmin → SQL), and locally:
--   mysql -h127.0.0.1 -uitacadem_cms -plocaldevpass itacadem_cms < server/sql/seed_courses.sql

INSERT INTO courses (
  slug, title_ru, title_uz, summary_ru, summary_uz,
  duration_ru, duration_uz, lessons_ru, lessons_uz, format_ru, format_uz,
  lesson_duration_ru, lesson_duration_uz, button_ru, button_uz, button_url,
  image, sort_order, is_published
) VALUES
('web_programming', 'Веб-программирование', 'Veb-dasturlash', 'Изучите самые актуальные технологии веб-разработки и станьте мастером своего дела.', 'Eng dolzarb veb-dasturlash texnologiyalarini o‘rganing va o‘z kasbingizning ustasi bo‘ling.', '8 месяцев', '8 oy', '64', '64', 'Офлайн', 'Oflayn', '2 часа', '2 soat', 'Узнать подробнее', 'Batafsil', '/web_programming', 'courses_home.jpg', 1, 1),
('graphic', 'Графический дизайн', 'Grafik dizayn', 'Научитесь работать с цветом, композицией и шрифтами, создавайте стильные и профессиональные визуалы!', 'Rang, kompozitsiya va shriftlar bilan ishlashni o‘rganing, zamonaviy va professional vizual tasvirlar yarating!', '6 месяцев', '6 oy', '48', '48', 'Офлайн', 'Oflayn', '2 часа', '2 soat', 'Узнать подробнее', 'Batafsil', '/graphic', 'courses_graphic_design.jpg', 2, 1),
('python', 'Python', 'Python', 'Освойте универсальный язык программирования для веба, автоматизации, анализа данных и создания ИИ!', 'Veb, avtomatlashtirish, ma’lumotlarni tahlil qilish va sun’iy intellekt yaratish uchun universal dasturlash tilini o‘zlashtiring!', '8 месяцев', '8 oy', '64', '64', 'Офлайн', 'Oflayn', '2 часа', '2 soat', 'Узнать подробнее', 'Batafsil', '/python', 'courses_python-2.jpg', 3, 1),
('nodejs', 'Node.js', 'Node.js', 'Вы действующий front-end разработчик? Усильте свои навыки, став fullstack не изучая дополнительный язык программирования', 'Siz amaldagi front-end dasturchimisiz? Qo‘shimcha dasturlash tilini o‘rganmasdan fullstack bo‘lish orqali mahoratingizni oshiring', '8 месяцев', '8 oy', '64', '64', 'Офлайн', 'Oflayn', '2 часа', '2 soat', 'Узнать подробнее', 'Batafsil', '/nodejs', 'courses_nodejs.jpg', 4, 1),
('datascience', 'Data Science', 'Data Science', 'Анализ больших данных, машинное обучение, тестирование и решение задач', 'Katta hajmli ma’lumotlarni tahlil qilish, mashinali o‘rganish, sinovdan o‘tkazish va muammolarni hal qilish', '6–8 месяцев', '6–8 oy', '48', '48', 'Офлайн', 'Oflayn', '2 часа', '2 soat', 'Узнать подробнее', 'Batafsil', '/datascience', 'courses_data_science.png', 5, 1)
ON DUPLICATE KEY UPDATE
  title_ru = VALUES(title_ru), title_uz = VALUES(title_uz),
  summary_ru = VALUES(summary_ru), summary_uz = VALUES(summary_uz),
  duration_ru = VALUES(duration_ru), duration_uz = VALUES(duration_uz),
  lessons_ru = VALUES(lessons_ru), lessons_uz = VALUES(lessons_uz),
  format_ru = VALUES(format_ru), format_uz = VALUES(format_uz),
  lesson_duration_ru = VALUES(lesson_duration_ru), lesson_duration_uz = VALUES(lesson_duration_uz),
  button_ru = VALUES(button_ru), button_uz = VALUES(button_uz), button_url = VALUES(button_url),
  image = VALUES(image), sort_order = VALUES(sort_order);
