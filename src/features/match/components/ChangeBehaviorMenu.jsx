import { useEffect, useState } from "react";

export function ChangeBehaviorMenu({
  player,
  behaviors = [],
  isLoading = false,
  isSubmitting = false,
  error = null,
  onConfirm,
  onCancel,
}) {
  const [selectedBehaviorId, setSelectedBehaviorId] = useState(
    player?.currentBehaviorId ?? null
  );

  useEffect(
    function () {
      setSelectedBehaviorId(player?.currentBehaviorId ?? null);
    },
    [player?.player_id, player?.currentBehaviorId]
  );

  if (!player) {
    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (selectedBehaviorId === null || selectedBehaviorId === undefined) {
      return;
    }
    onConfirm(selectedBehaviorId);
  }

  const isConfirmDisabled =
    isLoading ||
    isSubmitting ||
    selectedBehaviorId === null ||
    selectedBehaviorId === undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-behavior-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 text-slate-100 shadow-xl">
        <h2
          id="change-behavior-title"
          className="text-xl font-bold text-white"
        >
          Cambiar comportamiento
        </h2>

        <p className="mt-1 text-sm text-slate-300">
          Jugador objetivo:{" "}
          <span className="font-semibold text-white">
            {player.name || `Jugador ${player.player_id}`}
          </span>
          {player.number !== undefined && player.number !== null && (
            <span className="ml-2 rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-200">
              #{player.number}
            </span>
          )}
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-500/50 bg-red-900/40 p-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Cargando comportamientos...
            </p>
          ) : behaviors.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No hay comportamientos disponibles.
            </p>
          ) : (
            <ul
              role="listbox"
              aria-label="Comportamientos disponibles"
              className="max-h-64 space-y-2 overflow-y-auto pr-1"
            >
              {behaviors.map(function (behavior) {
                const isSelected = selectedBehaviorId === behavior.behavior_id;

                return (
                  <li key={behavior.behavior_id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={isSubmitting}
                      onClick={function () {
                        setSelectedBehaviorId(behavior.behavior_id);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-600/30 text-white"
                          : "border-slate-700 bg-slate-900/60 text-slate-200 hover:border-slate-500"
                      }`}
                    >
                      <span className="font-medium">{behavior.name}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          behavior.is_default
                            ? "bg-slate-700 text-slate-300"
                            : "bg-emerald-900/60 text-emerald-300"
                        }`}
                      >
                        {behavior.is_default ? "Por defecto" : "Personalizado"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isConfirmDisabled}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Guardando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}