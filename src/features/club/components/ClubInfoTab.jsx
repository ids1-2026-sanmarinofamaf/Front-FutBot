import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../../shared/components/Avatar';

function EditButton({ title, onClick, disabled }) {
  return (
    <button title={title} onClick={onClick} disabled={disabled}
      className="p-2 text-slate-400 hover:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="m16 3 5 5-12 12-6 1 1-6L16 3Z M13 6l5 5" />
      </svg>
    </button>
  );
}

export function ClubInfoTab({ user, club, onEditName, onEditAvatar, editingDisabled = false }) {
  const navigate = useNavigate();

  return (
    <>
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-slate-100 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex items-center gap-2">
          <Avatar avatar={club.club_avatar} name={club.club_name} clubId={club.club_id} className="w-28 h-28" />
          <EditButton title="Editar avatar" onClick={onEditAvatar} disabled={editingDisabled} />
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold break-words">{club.club_name}</h2>
          <EditButton title="Editar nombre" onClick={onEditName} disabled={editingDisabled} />
        </div>
      </div>
      <div className="rounded-xl border border-slate-700 p-6 text-slate-300">
        <p>Usuario: {user.user_name}</p>
        <p>Correo electrónico: {user.user_email}</p>
      </div>
      <button onClick={() => navigate('/club/players')}
        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-colors shadow-md">
        Gestión de Jugadores
      </button>
      <button onClick={() => navigate('/club/behaviors')}
        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-colors shadow-md">
        Gestión de Comportamientos
      </button>
    </>
  );
}
