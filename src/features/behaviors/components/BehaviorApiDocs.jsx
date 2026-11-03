import { API_CATEGORIES } from '../behaviorApiData';

export function BehaviorApiDocs({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-slate-900 border-l border-slate-700 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              Back-FutBot / docs / API.md
            </span>
            <h2 className="text-lg font-bold text-slate-100">
              Manual de comportamientos.
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 cursor-pointer"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Reglas clave resumidas */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
            <h3 className="text-sm font-semibold text-emerald-400">
              Reglas de ejecución
            </h3>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>
                Todo comportamiento debe definir <code className="text-amber-300">def play():</code> sin argumentos.
              </li>
              <li>
                Se ejecuta <strong>una vez por tic</strong> para cada jugador BOT que lo tenga asignado.
              </li>
              <li>
                Debe devolver exactamente una primitiva de acción:{' '}
                <code className="text-emerald-300">move(dir, speed)</code>,{' '}
                <code className="text-emerald-300">kick(dir, force)</code> o{' '}
                <code className="text-emerald-300">wait()</code>.
              </li>
              <li>
                Las acciones no persisten entre tics y deben finalizar dentro del límite de tiempo del servidor.
              </li>
            </ul>
          </div>

          {/* Listado por categorías */}
          {API_CATEGORIES.map((cat) => (
            <div key={cat.id} className="space-y-3">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-slate-100">{cat.title}</h3>
                <p className="text-xs text-slate-400">{cat.description}</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {cat.items.map((item) => (
                  <div
                    key={item.name}
                    className={`p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/80 border-l-4 ${cat.accentClass}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <code className="text-sm font-bold text-amber-300 font-mono">
                        {item.signature}
                      </code>
                      <span className={`text-[11px] px-2 py-0.5 rounded border font-mono ${cat.badgeClass}`}>
                        {item.returnType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mb-2">{item.description}</p>
                    <pre className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 font-mono text-xs text-emerald-300 whitespace-pre-wrap">
                      {item.statementSnippet}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
