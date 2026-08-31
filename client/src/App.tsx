import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.js";
import Signup from "./pages/Signup.js";
import SignupChoice from "./pages/SignupChoice.js";
import Login from "./pages/Login.js";
import CheckEmail from "./pages/CheckEmail.js";
import VerifyEmail from "./pages/VerifyEmail.js";
import ProfileEditor from "./pages/ProfileEditor.js";
import DjProfileEditor from "./pages/DjProfileEditor.js";
import MusicianPublicProfile from "./pages/MusicianPublicProfile.js";
import Search from "./pages/Search.js";
import Dashboard from "./pages/Dashboard.js";
import Messages from "./pages/Messages.js";
import MapPage from "./pages/MapPage.js";
import Notifications from "./pages/Notifications.js";
import Favorites from "./pages/Favorites.js";
import CertificationConfirm from "./pages/CertificationConfirm.js";
import NotFound from "./pages/NotFound.js";
import AdminDashboard from "./pages/AdminDashboard.js";
import { RequireAuth } from "./routes/RequireAuth.js";
import { RequireAdmin } from "./routes/RequireAdmin.js";

export default function App() {
  return (
    <Routes>
      {/* La carte est la page d'accueil, publique */}
      <Route path="/" element={<MapPage />} />
      <Route path="/carte" element={<MapPage />} />
      <Route path="/bienvenue" element={<Landing />} />
      <Route path="/inscription" element={<SignupChoice />} />
      <Route path="/inscription/musicien" element={<Signup role="MUSICIAN" />} />
      <Route path="/inscription/recruteur" element={<Signup role="RECRUITER" />} />
      <Route path="/inscription/touriste" element={<Signup role="TOURIST" />} />
      <Route path="/inscription/organisateur" element={<Signup role="ORGANIZER" />} />
      <Route path="/inscription/festival" element={<Signup role="FESTIVAL" />} />
      <Route path="/inscription/lieu" element={<Signup role="VENUE" />} />
      <Route path="/connexion" element={<Login />} />
      <Route path="/verification-envoyee" element={<CheckEmail />} />
      <Route path="/verifier-email" element={<VerifyEmail />} />
      <Route path="/musiciens/:id" element={<MusicianPublicProfile />} />
      <Route path="/certifier/:token" element={<CertificationConfirm />} />
      <Route
        path="/profil/editer"
        element={
          <RequireAuth>
            <ProfileEditor />
          </RequireAuth>
        }
      />
      <Route
        path="/profil/dj/editer"
        element={
          <RequireAuth>
            <DjProfileEditor />
          </RequireAuth>
        }
      />
      <Route
        path="/tableau-de-bord"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      {/* Recherche d'artistes : publique (visiteurs & touristes) */}
      <Route path="/recherche" element={<Search />} />
      <Route
        path="/messages"
        element={
          <RequireAuth>
            <Messages />
          </RequireAuth>
        }
      />
      <Route
        path="/notifications"
        element={
          <RequireAuth>
            <Notifications />
          </RequireAuth>
        }
      />
      <Route
        path="/favoris"
        element={
          <RequireAuth>
            <Favorites />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
