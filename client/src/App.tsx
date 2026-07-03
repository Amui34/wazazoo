import { Routes, Route } from "react-router-dom";

function Landing() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">GigLink</h1>
        <p className="mt-2 text-neutral-400">
          La plateforme de mise en relation musiciens / lieux — en construction.
        </p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
    </Routes>
  );
}
