import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import InterviewList from "@/pages/InterviewList";
import InterviewDetail from "@/pages/InterviewDetail";
import TagsPage from "@/pages/TagsPage";
import SearchPage from "@/pages/SearchPage";
import PeoplePage from "@/pages/PeoplePage";
import PersonDetailPage from "@/pages/PersonDetailPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/interviews" element={<InterviewList />} />
          <Route path="/interviews/:id" element={<InterviewDetail />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/people/:id" element={<PersonDetailPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
