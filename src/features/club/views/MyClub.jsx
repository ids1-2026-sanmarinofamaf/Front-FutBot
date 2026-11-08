import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyClub, updateMyClub } from '../api';
import { getCurrentUser } from '../../friendlyGames/api'; 
import { ClubInfoTab } from '../components/ClubInfoTab';
import { ClubStatsTab } from '../components/ClubStatsTab';
import { EditClubNameModal } from '../components/EditClubNameModal';
import { EditClubAvatarModal } from '../components/EditClubAvatarModal';
import { useToast } from '../../../shared/hooks';
import RightDownAlert from '../../../shared/components/RightDownAlert';

export function MyClub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

  // Hooks para guardar informacion de club y de usuario
  const [user, setUser] = useState(null);
  const [club, setClub] = useState(null);
  // Hook para manejo de caso de cierre de sesión luego de llamado a API
  const [loading, setLoading] = useState(true);
  // Hooks para manejar modales de cambio de nombre u avatar
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Hooks para manejo de alertas
  const [alert, setAlert] = useState(null);
  const { toast, showToast } = useToast();
  const notify = (message, color) => {
    setAlert({ message, color });
    showToast();
  };

  const saveClub = async (changes) => {
    setSaving(true);

    // Envío de datos
    try {
      await updateMyClub(changes);
    } catch (error) {
      notify(error.message, 'red');
      setSaving(false);
      return;
    }

    setModal(null);
    setSaving(false);
    setRefreshing(true);
    notify('Club actualizado correctamente', 'green');

    // Actualización de datos
    try {
      setClub(await getMyClub());
    } catch (error) {
      notify(error.message, 'red');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {

    let active = true;

    const loadClub = async () => {

      try {

        // Ejecución en paralelo de llamados a API
        const [userData, clubData] = await Promise.all([
          getCurrentUser(),
          getMyClub(),
        ]);

        if (!active) return;
        setUser(userData);
        setClub(clubData);
        setLoading(false);

      } catch (error) {
        if (!active) return;
        navigate('/', { state: { clubLoadError: error.message } });
      }
    };

    loadClub();
    return () => { active = false; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-6">
      
      {alert && toast && (
        <RightDownAlert key={toast.id} errorTitle={alert.color === 'red' ? 'No se pudo actualizar el club' : 'Mi club'}
          errorDescription={alert.message} color={alert.color} />
      )}

      {/* Componentes para cambiar nombre y avatar */}
      {modal === 'name' && <EditClubNameModal name={club.club_name} onSave={saveClub} onCancel={() => setModal(null)} saving={saving} />}
      {modal === 'avatar' && <EditClubAvatarModal club={club} onSave={saveClub} onCancel={() => setModal(null)} saving={saving} />}

      <div className="max-w-7xl w-full flex flex-col gap-6">

        <div className="flex items-center justify-between">

          <h1 className="text-3xl font-bold text-slate-100 text-center mb-8">Mi Club</h1>

          <button
            onClick={() => navigate('/')}
            className="py-3 px-3 bg-slate-900 hover:bg-slate-800 text-slate-400 text-sm font-medium rounded-xl transition-colors"
          >
            Volver al Menú Principal
          </button>

        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-400">Cargando información del club…</p>
          </div>
        ) : (
          <>
            {/* Selector de pestañas */}
            <div className="flex gap-2 border-b border-slate-700">
              {[
                ['info', 'Información'],
                ['stats', 'Estadísticas'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 py-3 font-semibold border-b-2 transition-colors ${activeTab === id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Contenido de pestañas */}
            <div className="flex flex-col gap-6">
              {activeTab === 'info' ? (
                <ClubInfoTab user={user} club={club} editingDisabled={refreshing}
                  onEditName={() => setModal('name')} onEditAvatar={() => setModal('avatar')} />
              ) : (
                <ClubStatsTab statistics={club.statistics} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}