-- Seed default B2B courses so the /b2b/courses UI has representative content.
-- Idempotent-ish: removes these sample titles first, then inserts the current set.

DELETE FROM b2b_courses
WHERE title_ru IN (
  'Frontend для корпоративных команд',
  'Python автоматизация для бизнеса',
  'Data Science и AI для аналитиков',
  'UX/UI и дизайн-системы'
);

INSERT INTO b2b_courses
  (title_ru, title_uz, summary_ru, summary_uz, description_ru, description_uz,
   duration_ru, duration_uz, format_ru, format_uz, image, sort_order, is_published)
VALUES
  (
    'Frontend для корпоративных команд',
    'Korporativ jamoalar uchun Frontend',
    'Практический курс для сотрудников, которые должны уверенно работать с HTML, CSS, JavaScript и современным frontend-процессом.',
    'HTML, CSS, JavaScript va zamonaviy frontend jarayoni bilan ishonchli ishlashi kerak bo‘lgan xodimlar uchun amaliy kurs.',
    'Команда учится собирать адаптивные интерфейсы, работать с компонентами, Git и базовой архитектурой проекта. Программа адаптируется под ваш стек и реальные задачи компании.',
    'Jamoa adaptiv interfeyslar yaratish, komponentlar, Git va loyiha arxitekturasi asoslari bilan ishlashni o‘rganadi. Dastur kompaniyangiz steki va real vazifalariga moslashtiriladi.',
    '2 месяца',
    '2 oy',
    'Офлайн / онлайн',
    'Offline / online',
    'courses_home.jpg',
    10,
    1
  ),
  (
    'Python автоматизация для бизнеса',
    'Biznes uchun Python avtomatlashtirish',
    'Курс для команд, которым нужно автоматизировать рутину, обрабатывать данные и быстро создавать внутренние инструменты.',
    'Rutina ishlarni avtomatlashtirish, ma’lumotlarni qayta ishlash va ichki vositalarni tez yaratishi kerak bo‘lgan jamoalar uchun kurs.',
    'Участники изучают Python, работу с файлами и таблицами, API, базовые базы данных и сценарии автоматизации. В финале команда собирает мини-проект под свой отдел.',
    'Ishtirokchilar Python, fayl va jadvallar bilan ishlash, API, bazalar asoslari va avtomatlashtirish ssenariylarini o‘rganadi. Yakunda jamoa o‘z bo‘limi uchun mini-loyiha yaratadi.',
    '2.5 месяца',
    '2.5 oy',
    'Онлайн + практика',
    'Online + amaliyot',
    'courses_python-2.jpg',
    20,
    1
  ),
  (
    'Data Science и AI для аналитиков',
    'Analitiklar uchun Data Science va AI',
    'Интенсив для аналитиков и менеджеров, которые хотят использовать данные, ML-подходы и AI-инструменты в рабочих процессах.',
    'Ish jarayonlarida ma’lumotlar, ML yondashuvlari va AI vositalaridan foydalanmoqchi bo‘lgan analitiklar va menejerlar uchun intensiv.',
    'Разбираем очистку данных, визуализацию, базовые ML-модели, промптинг и практические AI-сценарии. Упор на понятные инструменты и измеримый бизнес-результат.',
    'Ma’lumotlarni tozalash, vizualizatsiya, asosiy ML modellar, prompting va amaliy AI ssenariylar ko‘rib chiqiladi. Asosiy e’tibor tushunarli vositalar va o‘lchanadigan biznes natijasiga qaratiladi.',
    '3 месяца',
    '3 oy',
    'Корпоративная группа',
    'Korporativ guruh',
    'courses_data_science.png',
    30,
    1
  ),
  (
    'UX/UI и дизайн-системы',
    'UX/UI va dizayn tizimlari',
    'Курс для продуктовых, маркетинговых и дизайн-команд: от исследования пользователя до макетов, прототипов и единой дизайн-системы.',
    'Produkt, marketing va dizayn jamoalari uchun kurs: foydalanuvchi tadqiqotidan maketlar, prototiplar va yagona dizayn tizimigacha.',
    'Команда учится проектировать сценарии, работать в Figma, собирать UI-киты и готовить макеты к передаче в разработку. Можно встроить ваши бренд-гайды и текущие продукты.',
    'Jamoa ssenariylar loyihalash, Figma’da ishlash, UI-kitlar yig‘ish va maketlarni dasturchilarga topshirishga tayyorlashni o‘rganadi. Brend-gayd va joriy mahsulotlaringizni dasturga qo‘shish mumkin.',
    '6 недель',
    '6 hafta',
    'Воркшоп + сопровождение',
    'Workshop + hamrohlik',
    'courses_graphic_design.jpg',
    40,
    1
  );
