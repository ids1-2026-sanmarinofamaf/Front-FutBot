export function SubstituteList({
  substitutes,
  playersInfo,
  x,
  y,
  team,
  isSubmitting,
  error,
  onSelect,
  onCancel,
}) {
  return (
    <foreignObject
      x={x}
      y={y}
      width={250}
      height={1}
      className="overflow-visible"
    >
      <div
        data-testid={`substitute-list-${team}`}
        onClick={function (event) {
          event.stopPropagation()
        }}
        className="w-[250px] rounded-md border-2 border-white bg-slate-800 p-2 text-white shadow-lg flex flex-col gap-2"
      >
        {substitutes.length === 0 && (
          <p className="py-2 text-center text-base text-white">
            Sin suplentes
          </p>
        )}

        {substitutes.map(function (substitute) {
          const info = playersInfo[String(substitute.player_id)]
          const name =
            info?.Name ||
            info?.name ||
            "Cargando..."

          return (
            <button
              key={substitute.player_id}
              type="button"
              data-testid={`substitute-option-${substitute.player_id}`}
              disabled={isSubmitting}
              onClick={function (event) {
                event.stopPropagation()
                onSelect(substitute)
              }}
              className="w-full rounded bg-slate-700 py-2 px-3 text-center text-lg font-bold text-white hover:bg-slate-600 disabled:cursor-default disabled:opacity-50 truncate"
            >
              {name}
            </button>
          )
        })}

        {isSubmitting && (
          <p className="px-1 text-center text-base text-white">
            Realizando sustitución...
          </p>
        )}

        {error && (
          <p className="px-1 text-center text-sm text-red-300 break-words">
            {error}
          </p>
        )}

        <button
          type="button"
          data-testid={`cancel-substitution-${team}`}
          disabled={isSubmitting}
          onClick={function (event) {
            event.stopPropagation()
            onCancel()
          }}
          className="w-full rounded bg-red-800 py-2 px-3 text-center text-base font-bold text-white hover:bg-red-700 disabled:cursor-default disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </foreignObject>
  )
}
