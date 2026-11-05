import { COACH_API_CATEGORIES } from '../coachApiData';

/**
 * Panel lateral modal con la documentación de primitivas y reglas de ejecución
 * para comportamientos de Director Técnico (`def coach():`).
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla si el panel de documentación está visible.
 * @param {() => void} props.onClose - Función para cerrar el panel.
 */
export function CoachApiDocs({ isOpen, onClose }) {
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
              Manual de comportamientos de DT.
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
                Todo comportamiento de DT debe definir <code className="text-amber-300">def coach():</code> sin argumentos.
              </li>
              <li>
                Se ejecuta al <strong>inicio de cada período</strong> y cuando <strong>cualquiera de los equipos convierte un gol</strong>.
              </li>
              <li>
                Debe devolver una lista de asignaciones construidas con{' '}
                <code className="text-emerald-300">assign(player_id, behavior_name)</code> (o{' '}
                <code className="text-emerald-300">[]</code> si no realiza cambios).
              </li>
              <li>
                Los cambios válidos se aplican desde el tic siguiente y deben finalizar dentro del límite de tiempo del servidor.
              </li>
            </ul>
          </div>

          {/* Listado por categorías */}
          {COACH_API_CATEGORIES.map((cat) => (
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