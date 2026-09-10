import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getCourses } from "../api.js";
import "./Courses.css";

// Every CMS course is rendered through this one template. Admin changes only
// content, ordering, publication state and imagery; layout stays consistent.
const IMG_GRAD = "linear-gradient(180deg, rgba(4,12,8,.42) 0%, rgba(4,12,8,.3) 38%, rgba(3,9,6,.88) 100%)";
const KNOWN_ROUTES = {
  web_programming: "/web_programming",
  graphic: "/graphic",
  python: "/python",
  nodejs: "/nodejs",
  datascience: "/datascience",
};

function assetSrc(value, version) {
  if (!value) return "";
  if (/^https?:\/\//.test(value)) return value;
  const path = String(value).replace(/^\/+/, "");
  if (path.includes("..") || !/^[\w][\w./-]*$/.test(path)) return "";
  return `/${path}${version ? `?v=${encodeURIComponent(version)}` : ""}`;
}

function safeCourseHref(value, slug) {
  const href = String(value || "").trim();
  // `/#contact` used to be the default for every newly created CMS course,
  // which meant its "more" button never opened a course page. Keep explicit
  // custom links, but otherwise route CMS-only courses to the shared template.
  if (href && href !== "/#contact" && (/^\/(?!\/)/.test(href) || /^https?:\/\//.test(href))) {
    return href;
  }
  if (KNOWN_ROUTES[slug]) return KNOWN_ROUTES[slug];
  return slug ? `/courses/${encodeURIComponent(slug)}` : "/#contact";
}

function Panel({ stats }) {
  return (
    <div className="cob-panel">
      {stats.map((stat) => (
        <div className="cob-pblock" key={stat.id}>
          <h3 className="cob-pk">{stat.title}</h3>
          <p className="cob-pv">{stat.text || "—"}</p>
        </div>
      ))}
    </div>
  );
}

function CourseLink({ to, children }) {
  if (/^https?:\/\//.test(to)) {
    return <a className="cob-btn" href={to}>{children}</a>;
  }
  return <Link className="cob-btn" to={to}>{children}</Link>;
}

function CourseBanner({ course }) {
  const slugClass = String(course.slug || "course").replace(/[^a-zA-Z0-9_-]/g, "-");
  return (
    <section
      className={`cob cob--course cob--${slugClass}`}
      style={{ backgroundImage: `${IMG_GRAD}, url(${course.image})` }}
    >
      <div className="cob-wrap">
        <h2 className="cob-title">{course.title}</h2>
        <div className="cob-details">
          <div className="cob-copy">
            <p className="cob-text">{course.text}</p>
            <Panel stats={course.stats} />
          </div>
          <CourseLink to={course.to}>{course.button}</CourseLink>
        </div>
      </div>
    </section>
  );
}

export default function Courses() {
  const { t, i18n } = useTranslation();
  const [managedCourses, setManagedCourses] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const block = (key) => t(key, { returnObjects: true }) || {};
  const lang = i18n.language?.startsWith("uz") ? "uz" : "ru";

  useEffect(() => {
    let alive = true;
    getCourses()
      .then((items) => {
        if (!alive) return;
        setManagedCourses(Array.isArray(items) ? items : []);
        setLoadFailed(false);
      })
      .catch(() => {
        if (!alive) return;
        setLoadFailed(true);
      });
    return () => { alive = false; };
  }, []);

  const home = block("webHome");
  const homeTop = home.top || {};
  const fallbacks = [
    {
      slug: "web_programming",
      title: [homeTop.title, homeTop.extra].filter(Boolean).join(" "),
      text: homeTop.text,
      stats: home.bottom || [],
      button: homeTop.link_2,
      to: "/web_programming",
      image: "/courses_home.jpg",
      sort_order: 1,
    },
    { slug: "graphic", ...block("coursesGraphicDesign"), to: "/graphic", image: "/courses_graphic_design.jpg", stats: block("coursesGraphicDesign").info || [], button: block("coursesGraphicDesign").link, sort_order: 2 },
    { slug: "python", ...block("coursesPython"), to: "/python", image: "/courses_python-2.jpg", stats: block("coursesPython").info || [], button: block("coursesPython").link, sort_order: 3 },
    { slug: "nodejs", ...block("coursesNodsJS"), to: "/nodejs", image: "/courses_nodejs.jpg", stats: block("coursesNodsJS").info || [], button: block("coursesNodsJS").link, sort_order: 4 },
    { slug: "datascience", ...block("coursesDataScience"), to: "/datascience", image: "/courses_data_science.png", stats: block("coursesDataScience").info || [], button: block("coursesDataScience").link, sort_order: 5 },
  ];
  const fallbackBySlug = new Map(fallbacks.map((course) => [course.slug, course]));
  const localized = (course, field) => course?.[`${field}_${lang}`] || course?.[`${field}_ru`] || "";
  const statLabels = [
    t("courseBanner.duration"),
    t("courseBanner.lessons"),
    t("courseBanner.format"),
    t("courseBanner.lessonDuration"),
  ];
  const statFields = ["duration", "lessons", "format", "lesson_duration"];

  const cmsBanners = (managedCourses || [])
    .slice()
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || Number(a.id || 0) - Number(b.id || 0))
    .map((course) => {
      const fallback = fallbackBySlug.get(course.slug);
      const stats = statFields.map((field, index) => {
        let value = localized(course, field) || fallback?.stats?.[index]?.text || "";
        if (!value && field === "duration" && course.duration_months) {
          value = `${course.duration_months} ${lang === "uz" ? "oy" : "мес."}`;
        }
        return { id: field, title: statLabels[index], text: value || "—" };
      });
      return {
        slug: course.slug,
        title: localized(course, "title") || fallback?.title || course.slug,
        text: localized(course, "summary") || localized(course, "description") || fallback?.text || "",
        stats,
        button: localized(course, "button") || fallback?.button || t("courseBanner.defaultButton"),
        to: safeCourseHref(course.button_url, course.slug),
        image: assetSrc(course.image, course.updated_at) || fallback?.image || "/courses_home.jpg",
      };
    });

  // Localized fallbacks keep the page usable while the CMS is loading or if it
  // is temporarily unreachable. A successful empty response remains empty, so
  // admins can intentionally hide every course.
  const banners = managedCourses === null || loadFailed
    ? fallbacks.map((course) => ({
        ...course,
        button: course.button || t("courseBanner.defaultButton"),
        stats: statFields.map((field, index) => ({
          id: field,
          title: statLabels[index],
          text: course.stats?.[index]?.text || "—",
        })),
      }))
    : cmsBanners;

  return (
    <>
      {banners.map((course) => <CourseBanner course={course} key={course.slug} />)}
      {banners.length === 0 && (
        <section className="course-empty">
          <p>{t("courseBanner.empty")}</p>
        </section>
      )}
    </>
  );
}
