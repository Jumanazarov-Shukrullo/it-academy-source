import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Schedule from "./pages/Schedule.jsx";
import Courses from "./pages/Courses.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import B2BCourses from "./pages/B2BCourses.jsx";
import B2BSchedule from "./pages/B2BSchedule.jsx";
import About from "./pages/About.jsx";
import News from "./pages/News.jsx";
import WebProgramming from "./pages/WebProgramming.jsx";
import Python from "./pages/Python.jsx";
import NodeJS from "./pages/NodeJS.jsx";
import DataScience from "./pages/DataScience.jsx";
import Graphic from "./pages/Graphic.jsx";
import Camp from "./pages/Camp.jsx";
import Dodo from "./pages/Dodo.jsx";
import OpenDay from "./pages/OpenDay.jsx";
import Vacancy from "./pages/Vacancy.jsx";
import Contacts from "./pages/Contacts.jsx";
import Oferta from "./pages/Oferta.jsx";
import NewsStories from "./pages/NewsStories.jsx";
import StudentPortal from "./pages/StudentPortal.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import AdminHome from "./pages/AdminHome.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminSchedule from "./pages/AdminSchedule.jsx";
import AdminB2BSchedule from "./pages/AdminB2BSchedule.jsx";
import AdminResource from "./pages/AdminResource.jsx";
import AdminContent from "./pages/AdminContent.jsx";
import AdminMedia from "./pages/AdminMedia.jsx";
import AdminVideos from "./pages/AdminVideos.jsx";
import AdminStudents from "./pages/AdminStudents.jsx";
import AdminLeads from "./pages/AdminLeads.jsx";
import NotFound from "./pages/NotFound.jsx";
import { getToken } from "./api.js";

function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/admin-panel" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Marketing */}
        <Route path="/" element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:slug" element={<CourseDetail />} />
        <Route path="/b2b" element={<Navigate to="/b2b/courses" replace />} />
        <Route path="/b2b/courses" element={<B2BCourses />} />
        <Route path="/b2b/schedule" element={<B2BSchedule />} />
        <Route path="/about" element={<About />} />
        <Route path="/news" element={<News />} />
        <Route path="/web_programming" element={<WebProgramming />} />
        <Route path="/python" element={<Python />} />
        <Route path="/nodejs" element={<NodeJS />} />
        <Route path="/datascience" element={<DataScience />} />
        <Route path="/graphic" element={<Graphic />} />
        <Route path="/camp" element={<Camp />} />
        <Route path="/dodo" element={<Dodo />} />
        <Route path="/openday" element={<OpenDay />} />
        <Route path="/vacancy" element={<Vacancy />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/oferta" element={<Oferta />} />
        <Route path="/news_stories/:id" element={<NewsStories />} />

        {/* Student portal — reads the hardened /api (admin token required). */}
        <Route path="/student/:id" element={<StudentPortal />} />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin — its own shell (no marketing header/footer). */}
      <Route path="/admin-panel" element={<AdminLogin />} />
      <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route path="/admin-panel/dashboard" element={<AdminHome />} />
        <Route path="/admin-panel/schedule" element={<AdminSchedule />} />
        <Route path="/admin-panel/b2b-schedule" element={<AdminB2BSchedule />} />
        <Route path="/admin-panel/content/:type" element={<AdminResource />} />
        <Route path="/admin-panel/texts" element={<AdminContent />} />
        <Route path="/admin-panel/media" element={<AdminMedia />} />
        <Route path="/admin-panel/videos" element={<AdminVideos />} />
        <Route path="/admin-panel/students" element={<AdminStudents />} />
        <Route path="/admin-panel/leads" element={<AdminLeads />} />
        <Route path="/admin-panel/student/:id" element={<StudentPortal />} />
      </Route>
    </Routes>
  );
}
