import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaLinkedin, FaInstagram, FaGithub, FaYoutube } from "react-icons/fa";

const API_KEY = import.meta?.env?.VITE_TMDB_API_KEY || null;
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/original";
const TVMAZE_BASE = "https://api.tvmaze.com";

function Header({ onToggleDark, dark, onSearch }) {
  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-colors ${dark ? 'bg-black/70' : 'bg-white/70'}`}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <div className="text-2xl font-extrabold text-red-600 hover:text-3xl cursor-pointer">Streamix</div>
         
        </div>

        <div className="flex items-center gap-8">
          <input
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search movie..."
            className="hidden sm:inline-block px-3 py-1 rounded bg-white/10 border border-gray-400 placeholder:text-sm outline-none"
          />
          <button
            onClick={onToggleDark}
            className="px-3 py-1 rounded bg-white/5 border border-white/10 text-sm hover:bg-red-500"
          >
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({ movie }) {
  if (!movie) return null;
  const bg = movie.backdrop_path ? IMAGE_BASE + movie.backdrop_path : movie.image?.original || null;
  return (
    <section className="relative h-[55vh] md:h-[70vh] w-full">
      {bg && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${bg}')`, filter: 'brightness(0.45)' }} />}
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 h-full flex items-end pb-10">
        <div className="text-white max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-extrabold">{movie.title || movie.name || movie.show?.name}</h1>
          <p className="mt-3 text-sm md:text-base opacity-90">Released: {movie.release_dacdte || movie.first_air_date || movie.premiered || '—'}</p>
          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 bg-white hover:bg-red-500 text-black rounded font-semibold cursor-pointer">Play</button>
            <button className="px-4 py-2 bg-gray-500 border hover:bg-gray-950 border-white/20 rounded cursor-pointer">More Info</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function MovieCard({ m, onOpen, provider }) {
  const poster = provider === 'tmdb' ? (m.poster_path ? IMAGE_BASE + m.poster_path : null) : m.image?.medium || null;
  if (!poster) return null;
  const title = m.title || m.name || m.show?.name;
  const rating = m.vote_average ? m.vote_average.toFixed(1) : m.rating?.average || '—';
  return (
    <div className="w-40 md:w-48 shrink-0 cursor-pointer hover:scale-105 transition-transform" onClick={() => onOpen(m)}>
      <div className="rounded overflow-hidden shadow-md">
        <img src={poster} alt={title} className="w-full h-[220px] object-cover" />
      </div>
      <h3 className="text-sm mt-2 truncate">{title}</h3>
      <p className="text-xs opacity-70">⭐ {rating}</p>
    </div>
  );
}

function MovieRow({ title, movies, onOpen, provider }) {
  return (
    <div className="my-6">
      <h2 className="text-white/90 font-semibold mb-3">{title}</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2">
        {movies.length > 0 ? movies.map((m) => (
          <MovieCard key={m.id || m.show?.id} m={m} onOpen={onOpen} provider={provider} />
        )) : <p className="text-gray-400 text-sm">No movies found.</p>}
      </div>
    </div>
  );
}

function Modal({ movie, onClose, provider }) {
  if (!movie) return null;
  const poster = provider === 'tmdb' ? (movie.poster_path ? IMAGE_BASE + movie.poster_path : null) : movie.image?.medium || null;
  const title = movie.title || movie.name || movie.show?.name;
  const overview = movie.overview || movie.summary?.replace(/<[^>]+>/g, '') || 'No description available.';
  const rating = movie.vote_average || movie.rating?.average || '—';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 w-11/12 md:w-3/4 lg:w-1/2 rounded p-6 relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col md:flex-row gap-4">
          {poster && <img src={poster} className="w-32 h-48 object-cover rounded" />}
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-sm mt-2 opacity-80">Rating: {rating}</p>
            <p className="mt-4 text-sm opacity-80">{overview}</p>
            <div className="mt-4 flex gap-3">
              <button className="px-4 py-2 bg-white text-black rounded cursor-pointer">Play</button>
              <button className="px-4 py-2 bg-white/5 border border-white/20 rounded cursor-pointer">Add to List</button>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-3 right-4 text-white/80 text-lg hover">✕</button>
      </div>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(true);
  const [featured, setFeatured] = useState(null);
  const [popular, setPopular] = useState([]);
  const [trending, setTrending] = useState([]);
  const [action, setAction] = useState([]);
  const [selected, setSelected] = useState(null);
  const [provider, setProvider] = useState('tmdb');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    const fetchTVMaze = async () => {
      try {
        const res = await axios.get(`${TVMAZE_BASE}/shows`);
        const results = res.data || [];
        setPopular(results.slice(0, 20));
        setTrending(results.slice(20, 40));
        setAction(results.filter((s, i) => i % 2 === 0).slice(0, 20));
        setFeatured(results[0] || null);
        setProvider('tvmaze');
      } catch (error) {
        console.error('Search failed:', error);
        setPopular([]);
        setTrending([]);
        setAction([]);
        setFeatured(null);
      }
    };

    const fetchTMDB = async () => {
      try {
        const [pop, trend, act] = await Promise.all([
          axios.get(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`),
          axios.get(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`),
          axios.get(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28&page=1`),
        ]);
        const popResults = pop.data.results || [];
        const trendResults = trend.data.results || [];
        const actResults = act.data.results || [];
        setPopular(popResults);
        setTrending(trendResults);
        setAction(actResults);
        setFeatured(popResults[Math.floor(Math.random() * popResults.length)] || null);
        setProvider('tmdb');
      } catch {
        fetchTVMaze();
      }
    };

    if (API_KEY) fetchTMDB(); else fetchTVMaze();
  }, []);

  const handleSearch = async (query) => {
    if (!query) return;
    if (provider === 'tmdb' && API_KEY) {
      try {
        const res = await axios.get(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
        setPopular(res.data.results || []);
      } catch (error) {
        console.error('Search failed:', error);
        setPopular([]);
      }
    } else {
      try {
        const res = await axios.get(`${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(query)}`);
        const shows = res.data.map(item => item.show);
        setPopular(shows || []);
      } catch (error) {
        console.error('Search failed:', error);
        setPopular([]);
      }
    }
  };

  return (
    <div className={`${dark ? 'bg-black text-white' : 'bg-gray-50 text-slate-900'} min-h-screen`}>
      <Header onToggleDark={() => setDark((d) => !d)} dark={dark} onSearch={handleSearch} />
      <main className="pt-16">
        <Hero movie={featured} />
        <section className="max-w-6xl mx-auto px-4 md:px-6 mt-6">
          <MovieRow title="Popular on Streamix" movies={popular} onOpen={setSelected} provider={provider} />
          <MovieRow title="Trending Now" movies={trending} onOpen={setSelected} provider={provider} />
          <MovieRow title="Action Movies" movies={action} onOpen={setSelected} provider={provider} />
        </section>
      </main>
      <Modal movie={selected} onClose={() => setSelected(null)} provider={provider} />
      <footer className="max-w-6xl mx-auto px-4 md:px-6 mt-10 text-sm opacity-70 ">
        <p>© Streamix — Made by Nitesh Tripathi (Frontend -Project)</p>
        {/* <p className="text-xs mt-1 opacity-60">Current data provider: {provider.toUpperCase()}</p> */}
         <div className="flex justify-start  gap-6 text-2xl  pb-4 mt-4">
        <a href="https://www.linkedin.com/in/niteshtripathi4544/" className="hover:text-blue-600 transition">
          <FaLinkedin />
        </a>
        <a href="#" className="hover:text-red-400 transition">
          <FaInstagram />
        </a>
        <a href="https://github.com/nitesh069" className="hover:text-red-600 transition">
          <FaGithub/>
        </a>
        <a href="http://www.youtube.com/@bwithcode" className="hover:text-red-600 transition">
          <FaYoutube />
        </a>
      </div>
      </footer>
    </div>
  );
}
