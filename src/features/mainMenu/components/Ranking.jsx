import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRankingREST } from '../api';
import { getCurrentUser } from '../../friendlyGames/api';

export default function Ranking({ onClose }) {
  const navigate = useNavigate();

  const [rawRanking,setRawRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState(null)

  useEffect(() => {

    const loadRanking = (async () => {
      try {
        setRawRanking(await getRankingREST())
      } catch (err) {
        // MANEJO DE ERRORES
      } finally {
        setLoading(false)
      }
    })

    const loadSessionData = async () => {
      try {
        const data = await getCurrentUser();
        console.log(data);        // el valor real
        setSessionData(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadSessionData()
    loadRanking()

  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100 uppercase tracking-wider">
            Ranking global
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl font-bold"
            aria-label="Cerrar ranking"
          >
            ×
          </button>
        </div>

        {loading && <p className="text-slate-400 text-center">Cargando...</p>}

        {/* {!loading && error && (
          <p className="text-red-400 text-center">No se pudo cargar el ranking.</p>
        )} */}

        {/* {!loading && !error && rawRanking.length === 0 && (
          <p className="text-slate-400 text-center">Aún no hay clubes en el ranking</p>
        )} */}

        {!loading  && rawRanking.length > 0 && ( // && !error
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-slate-100">
              <thead className="sticky top-0 bg-slate-800 text-sm text-slate-400">
                <tr>
                  <th className="px-4 py-3">Posición</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-3 py-3 text-center text-emerald-400">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {rawRanking.map((club, index) => (
                  <tr
                    key={club.club_id}
                    className={`border-t border-slate-700 transition-colors ${
                      club.club_id == sessionData?.user_id
                        ? 'bg-emerald-900/40'
                        : 'hover:bg-slate-700/50'
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3 font-bold">{club.club_name}</td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-400">
                      {club.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}