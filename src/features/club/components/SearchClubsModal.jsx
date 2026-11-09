import { useEffect, useState } from 'react';
import { getRankingREST } from '../../mainMenu/api';
import { getClub } from '../api';

export function SearchClubsModal({ onClose }) {

  // Estados para guardar el listado y el club seleccionado
  const [clubs, setClubs] = useState([]);
  const [club, setClub] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Estados para la búsqueda y la carga de datos
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Estado para mostrar errores dentro del modal
  const [error, setError] = useState(null);

  useEffect(() => {

    let active = true;

    const loadRanking = async () => {

      try {
        const data = await getRankingREST();

        if (!active) return;
        setClubs(data);

      } catch (error) {
        if (!active || error.status === 401) return;

        setError('No se pudo cargar el listado de clubes.');

      } finally {
        if (active) setLoading(false);
      }
    };

    loadRanking();

    return () => { active = false; };

  }, []);

  useEffect(() => {

    if (selectedId === null) return;

    let active = true;

    const loadClub = async () => {

      try {
        const data = await getClub(selectedId);

        if (!active) return;
        setClub(data);

      } catch (error) {
        if (!active || error.status === 401) return;

        if (error.status === 404) {
          setError('No se encontró el club.');
        } else {
          setError('No se pudo cargar el club.');
        }

      } finally {
        if (active) setLoading(false);
      }
    };

    loadClub();

    return () => { active = false; };

  }, [selectedId]);

  const handleSelectClub = (clubId) => {
    setError(null);
    setLoading(true);
    setSelectedId(clubId);
  };

  const handleBack = () => {
    setSelectedId(null);
    setClub(null);
    setError(null);
    setLoading(false);
  };

  const filteredClubs = clubs.filter((item) =>
    item.club_name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <section
        className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-6 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 p-6 text-[1.75rem] leading-[2.125rem] text-[#F2F2F2]"
      >

        <div className="flex items-start justify-between gap-4">

          <h2 className="text-[2.5rem] leading-[2.875rem] font-bold">Buscar usuarios</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            X
          </button>

        </div>

        {selectedId === null && (
          <div>

            <label htmlFor="club-search">Buscar club por nombre</label>

            <input
              id="club-search"
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 p-3"
            />

          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-[#499dbd]" />
            <p>{selectedId === null ? 'Cargando clubes…' : 'Cargando club…'}</p>
          </div>
        )}

        {error && (
          <p className="text-red-400">{error}</p>
        )}

        {!loading && !error && selectedId === null && (
          <>
            {filteredClubs.length === 0 && (
              <p className="text-slate-400">No se encontraron clubes.</p>
            )}

            {filteredClubs.length > 0 && (
              <ul className="flex flex-col gap-3">
                {filteredClubs.map((item) => (
                  <li key={item.club_id}>

                    <button
                      type="button"
                      onClick={() => handleSelectClub(item.club_id)}
                      className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-900 p-4 text-left hover:bg-slate-700"
                    >
                      <span className="min-w-0 break-words font-bold">
                        {item.club_name}
                      </span>

                      <span className="shrink-0 text-[#499dbd]">
                        {item.points} puntos
                      </span>
                    </button>

                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {!loading && club && (
          <p className="font-bold">{club.club_name}</p>
        )}

        {selectedId !== null && (
          <button
            type="button"
            onClick={handleBack}
            className="self-start rounded-lg bg-slate-700 px-4 py-2 hover:bg-slate-600"
          >
            Volver
          </button>
        )}

      </section>
    </div>
  );
}
