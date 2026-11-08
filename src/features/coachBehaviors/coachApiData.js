/**
 * Catálogo estructurado de la Coach Behavior API (DT) de FutBot
 */

export const COACH_API_CATEGORIES = [
  {
    id: 'coach_primitives',
    title: 'Coach Primitives (Exclusivas de DT)',
    badgeClass: 'bg-violet-950/80 text-violet-300 border-violet-700/60',
    accentClass: 'border-l-violet-400',
    description: 'Consultan el evento disparador, los comportamientos y los suplentes disponibles del equipo.',
    items: [
      {
        name: 'trigger',
        signature: 'trigger() -> CoachTrigger',
        returnType: 'CoachTrigger',
        statementSnippet: 'if trigger() == CoachTrigger.GOAL_AGAINST:\n    pass',
        description: 'Devuelve el evento que provocó la ejecución actual del DT (GOAL_FOR, GOAL_AGAINST o PERIOD_START).',
      },
      {
        name: 'current_behavior',
        signature: 'current_behavior(player_id: int) -> str | None',
        returnType: 'str | None',
        statementSnippet: 'current = current_behavior(player_id)',
        description: 'Devuelve el nombre del comportamiento que ejecuta actualmente el jugador propio en cancha indicado, o None.',
      },
      {
        name: 'available_behaviors',
        signature: 'available_behaviors() -> list[str]',
        returnType: 'list[str]',
        statementSnippet: 'behaviors = available_behaviors()',
        description: 'Devuelve la lista de nombres de comportamientos de jugador que el DT puede asignar (propios del club y por defecto).',
      },
      {
        name: 'bench',
        signature: 'bench() -> list[int]',
        returnType: 'list[int]',
        statementSnippet: 'substitutes = bench()',
        description: 'Devuelve la lista de identificadores de los jugadores suplentes propios que están en el banco.',
      },
      {
        name: 'can_substitute',
        signature: 'can_substitute() -> bool',
        returnType: 'bool',
        statementSnippet: 'if can_substitute():\n    pass',
        description: 'Devuelve True si en este momento se aceptaría una sustitución pedida por el DT (False si ya se sustituyó en el período, en el último cuarto o si hay una sustitución manual pendiente).',
      },
    ],
  },
  {
    id: 'coach_actions',
    title: 'Coach Actions (Retorno de coach)',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    accentClass: 'border-l-emerald-400',
    description: 'Construyen los comandos (asignaciones de comportamiento y sustituciones) que debe devolver coach() dentro de una lista.',
    items: [
      {
        name: 'assign',
        signature: 'assign(player_id: int, behavior_name: str) -> Assignment',
        returnType: 'tuple[int, str]',
        statementSnippet: 'return [assign(player_id, "Attacker")]',
        description: 'Solicita que el jugador propio en cancha player_id pase a ejecutar behavior_name a partir del próximo tic.',
      },
      {
        name: 'substitute',
        signature: 'substitute(player_out_id: int, player_in_id: int) -> Substitution',
        returnType: 'Substitution',
        statementSnippet: 'return [substitute(player_out_id, player_in_id)]',
        description: 'Solicita que el jugador propio en cancha player_out_id sea reemplazado por el suplente propio player_in_id en la próxima pausa.',
      },
    ],
  },
  {
    id: 'match_state',
    title: 'Match State Primitives',
    badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
    accentClass: 'border-l-sky-400',
    description: 'Consultan el estado actual del partido en el tic en que se ejecuta el DT. No modifican el estado.',
    items: [
      {
        name: 'score',
        signature: 'score() -> tuple[int, int]',
        returnType: 'tuple[int, int]',
        statementSnippet: 'my_score, rival_score = score()',
        description: 'Resultado actual del partido: (goles_propios, goles_rival).',
      },
      {
        name: 'match_time_remaining',
        signature: 'match_time_remaining() -> float',
        returnType: 'float',
        statementSnippet: 'remaining_sec = match_time_remaining()',
        description: 'Tiempo restante total del partido en segundos.',
      },
      {
        name: 'current_period',
        signature: 'current_period() -> Period',
        returnType: 'Period',
        statementSnippet: 'if current_period().value == 2:\n    pass',
        description: 'Cuarto actual del partido (.value devuelve 1, 2, 3 o 4; .name devuelve "FIRST_QUARTER" .. "FOURTH_QUARTER").',
      },
      {
        name: 'period_time_remaining',
        signature: 'period_time_remaining() -> float',
        returnType: 'float',
        statementSnippet: 'period_sec = period_time_remaining()',
        description: 'Tiempo restante del período actual en segundos.',
      },
      {
        name: 'teammates',
        signature: 'teammates() -> list[PlayerState]',
        returnType: 'list[tuple[int, Position]]',
        statementSnippet: 'for player_id, player_position in teammates():\n    pass',
        description: 'Lista de tuplas (id, posición) de todos los jugadores propios actualmente en cancha.',
      },
      {
        name: 'opponents',
        signature: 'opponents() -> list[PlayerState]',
        returnType: 'list[tuple[int, Position]]',
        statementSnippet: 'for opponent_id, opponent_position in opponents():\n    pass',
        description: 'Lista de tuplas (id, posición) de todos los jugadores rivales actualmente en cancha.',
      },
      {
        name: 'ball',
        signature: 'ball() -> BallState',
        returnType: 'tuple[Position, Velocity]',
        statementSnippet: 'ball_position, ball_velocity = ball()',
        description: 'Devuelve la posición (x, y) y velocidad (vx, vy) actuales de la pelota.',
      },
    ],
  },
  {
    id: 'geometry_physics',
    title: 'Geometry & Physics Helpers',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    accentClass: 'border-l-amber-400',
    description: 'Funciones auxiliares provistas por el servidor para cálculo de distancias y vectores unitarios.',
    items: [
      {
        name: 'distance',
        signature: 'distance(from_position: Position, to_position: Position) -> float',
        returnType: 'float',
        statementSnippet: 'ball_distance = distance(player_position, ball_position)',
        description: 'Devuelve la distancia euclidiana entre dos posiciones (x, y).',
      },
      {
        name: 'direction_to',
        signature: 'direction_to(from_position: Position, to_position: Position) -> Direction',
        returnType: 'Direction',
        statementSnippet: 'target_dir = direction_to(player_position, ball_position)',
        description: 'Devuelve el vector unitario (dx, dy) desde from_position hacia to_position.',
      },
    ],
  },
  {
    id: 'constants',
    title: 'Coach & Match Enums',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60',
    accentClass: 'border-l-cyan-400',
    description: 'Enumeraciones de eventos disparadores del DT y períodos del partido.',
    items: [
      {
        name: 'CoachTrigger',
        signature: 'CoachTrigger.GOAL_FOR | GOAL_AGAINST | PERIOD_START',
        returnType: 'CoachTrigger',
        statementSnippet: 'if trigger() == CoachTrigger.PERIOD_START:\n    pass',
        description: 'Eventos que disparan la ejecución de coach(): gol propio (GOAL_FOR), gol rival (GOAL_AGAINST) o inicio de período (PERIOD_START).',
      },
    ],
  },
];

