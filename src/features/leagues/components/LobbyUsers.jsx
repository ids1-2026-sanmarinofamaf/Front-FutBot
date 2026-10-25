import { Avatar } from "../../../shared/components/Avatar"

function LobbyUserCard(user){
    return(
        <div className="h-full p-4 bg-slate-800 border border-slate-700 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <Avatar avatar={user.avatar} name={user.user_name} clubId={user.club_id} />
                <span className="text-lg font-bold text-slate-100">
                    {user.user_name}
                </span>

            </div>
        </div>
    )
}

export function LobbyUsers({users}){
    return(
        <div className="grid grid-cols-1 gap-4">
            {users.map(user => (LobbyUserCard(user)))}
        </div>
    )
}