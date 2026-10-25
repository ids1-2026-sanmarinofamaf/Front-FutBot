import { Avatar } from "../../../shared/components/Avatar"
// AGREGAR QUE EL CREADOR TENGA UN SIMBOLO O ALGO

/**
 * 
 * @param {*} user_name: nombre del usuario
 * @param avatar: avatar del usuario, llega en formato string base64
 * @param club_id: ID del club del usuario
 * @param is_creator: booleano para indicar si el usuario es el creador de la sala  
 * @returns componente que contiene toda la información de un usuario
 */
function LobbyUserCard({ user_name, avatar, club_id, is_creator }) {
  return (
    <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-sm">
      <div className="flex items-center justify-between gap-4 min-w-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0">
            <Avatar avatar={avatar} name={user_name} clubId={club_id} />
          </div>
          <span
            title={user_name}
            className="min-w-0 truncate text-lg font-bold text-slate-100"
          >
            {user_name}
          </span>
        </div>

        {is_creator && (
          <span className="shrink-0 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full">
            Anfitrión
          </span>
        )}
      </div>
    </div>
  );
}

export function LobbyUsers({ users }) {
  return (
    <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2">
      {users.map((user) => (
        <LobbyUserCard key={user.club_id} {...user} />
      ))}
    </div>
  )
}