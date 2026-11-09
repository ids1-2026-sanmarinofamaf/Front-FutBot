import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PlayOption } from '../components/PlayOption';
import { Avatar } from '../../../shared/components/Avatar';
import { getMyClub } from '../../club/api';
import Ranking from '../components/Ranking';
import { useToast } from '../../../shared/hooks';
import RightDownAlert from '../../../shared/components/RightDownAlert';
import { SearchClubsModal } from '../../club/components/SearchClubsModal';

export function MainMenu() {
  const [isPlayOptionOpen, setIsPlayOptionOpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [club, setClub] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // sirve para consultar información de la ruta actual
  const [alert, setAlert] = useState(null);
  const { toast, showToast } = useToast();

  useEffect(() => {
    let active = true;
    getMyClub().then((data) => {
      if (active) setClub(data);
    }).catch(() => {
      // El menú sigue disponible si falla la consulta del avatar.
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (location.state?.clubLoadError) {
      setAlert(location.state.clubLoadError);
      showToast();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate, showToast]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      {alert && toast && (
        <RightDownAlert
          key={toast.id}
          errorTitle="No se pudo cargar la información del club"
          errorDescription={alert}
          color="red"
        />
      )}
      <div className="max-w-md w-full flex flex-col gap-6">
        <h1 className="text-4xl font-extrabold text-slate-100 text-center mb-8">
          FUTBOT
        </h1>

        <button 
          onClick={() => navigate('/club')}
          className="w-full grid grid-cols-[4rem_1fr_4rem] items-center gap-4 p-4 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-500 rounded-xl transition-all shadow-md group"
        >
          <div className="w-16 h-16 bg-slate-900 rounded-full border border-slate-600 overflow-hidden flex-shrink-0">
            <Avatar
              avatar={club?.club_avatar}
              name="Avatar del Club"
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <span className="text-xl font-bold text-slate-200 text-center">
            Mi Club
          </span>
        </button>

        <button 
          onClick={() => setIsPlayOptionOpen(true)}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-xl transition-colors shadow-lg"
        >
          JUGAR
        </button>

        <button 
          onClick={() => setIsRankingOpen(true)}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-xl transition-colors shadow-lg"
        >
          RANKING
        </button>

        <button onClick={() => setIsSearchOpen(true)}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-xl transition-colors shadow-lg">
          Buscar usuarios
        </button>
      </div>

      {isSearchOpen && <SearchClubsModal onClose={() => setIsSearchOpen(false)} />}

      {isPlayOptionOpen && (
        <PlayOption onClose={() => setIsPlayOptionOpen(false)} />
      )}

      {isRankingOpen && ( 
        <Ranking onClose={() => setIsRankingOpen(false)} />
      )}
      
    </div>
  );
}
