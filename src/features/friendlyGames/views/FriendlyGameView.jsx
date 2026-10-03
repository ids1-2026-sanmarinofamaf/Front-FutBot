import { useState } from "react";
import { RosterBuilder } from "../../roster/components/RosterBuilder";
import CreateFG from "../components/CreateFG";

export default function FriendlyGames() {
    const [createFMisOpen, setCreateFMisOpen] = useState(false)

    
    return(
    <div className="leading-normal mi-fuente min-h-screen 
                    bg-slate-900 
                    flex flex-col items-center justify-start p-4">
        <h1 className="text-4xl font-extrabold text-transparent
                       bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-3">
            PARTIDOS AMISTOSOS
        </h1>

        {createFMisOpen && <CreateFG onClose={() => setCreateFMisOpen(false)} />}

        <button onClick={() => setCreateFMisOpen(true)}>
            NUEVO
        </button>
    </div>)
}
