import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";
import { Reveal } from "../components/Reveal.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { MusicLineArt } from "../components/MusicLineArt.js";

const steps = [
  {
    title: "Crée ton profil",
    text: "Bio, styles musicaux, instruments, photos, extraits audio/vidéo, ville et tarif indicatif.",
  },
  {
    title: "Sois découvert",
    text: "Les lieux te trouvent via la recherche par style, zone et disponibilité, et t'envoient une demande de contact.",
  },
  {
    title: "Joue et fais-toi certifier",
    text: "Après une prestation, le lieu certifie ta présence — un badge vérifié qui renforce ton profil.",
  },
];

const features = [
  {
    title: "Profils vérifiés",
    text: "Chaque certification est confirmée directement par le lieu, impossible de la falsifier.",
  },
  {
    title: "Recherche ciblée",
    text: "Filtrez par style musical, ville, disponibilité, budget et nombre de certifications.",
  },
  {
    title: "Contact maîtrisé",
    text: "Ton numéro reste privé : le recruteur envoie une demande, tu choisis de partager tes coordonnées.",
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <AmbientLights />
      <MusicLineArt />

      <div className="relative">
        <Navbar />

        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="animate-fade-in-up text-4xl font-semibold leading-tight sm:text-5xl">
            Le live près de chez toi
          </h1>
          <p
            className="mx-auto mt-6 max-w-2xl animate-fade-in-up text-lg text-neutral-400"
            style={{ animationDelay: "120ms" }}
          >
            Concerts, DJ sets, soirées et festivals autour de toi, en temps réel.
            Trouve quoi faire ce soir sur la carte — et suis tes artistes, lieux et
            organisateurs préférés pour ne rien rater.
          </p>
          <div
            className="mt-10 flex animate-fade-in-up flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              to="/inscription/musicien"
              className="w-full rounded-md bg-white px-6 py-3 text-sm font-medium text-neutral-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-200 hover:shadow-lg hover:shadow-white/10 sm:w-auto"
            >
              Je suis musicien
            </Link>
            <Link
              to="/inscription/recruteur"
              className="w-full rounded-md border border-neutral-700 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-400 sm:w-auto"
            >
              Je cherche un musicien
            </Link>
          </div>
        </section>

        <section className="border-t border-neutral-800 bg-neutral-900/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <h2 className="text-center text-2xl font-semibold">Comment ça marche</h2>
            </Reveal>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {steps.map((step, i) => (
                <Reveal key={step.title} delay={i * 120}>
                  <div className="group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-neutral-950 transition-transform duration-300 group-hover:scale-110">
                      {i + 1}
                    </div>
                    <h3 className="mt-4 font-medium">{step.title}</h3>
                    <p className="mt-2 text-sm text-neutral-400">{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold">Pourquoi WAZAZOO</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {features.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 120}>
                <div className="h-full rounded-lg border border-neutral-800 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-600 hover:bg-neutral-900/60">
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="mt-2 text-sm text-neutral-400">{feature.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="border-t border-neutral-800">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center">
            <Reveal>
              <h2 className="text-2xl font-semibold">Prêt à commencer ?</h2>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/inscription/musicien"
                  className="w-full rounded-md bg-white px-6 py-3 text-sm font-medium text-neutral-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-200 hover:shadow-lg hover:shadow-white/10 sm:w-auto"
                >
                  Créer mon profil musicien
                </Link>
                <Link
                  to="/inscription/recruteur"
                  className="w-full rounded-md border border-neutral-700 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-400 sm:w-auto"
                >
                  Créer un compte recruteur
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
