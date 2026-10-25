import { Avatar } from "../../../shared/components/Avatar"

function LobbyUserCard({ user_name, avatar, club_id }) {
  return (
    <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-sm">
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
    </div>
  )
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