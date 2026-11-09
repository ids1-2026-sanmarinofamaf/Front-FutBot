import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import "@testing-library/jest-dom/vitest"
import FixtureTab from "./FixtureTab"

// ÍNDICE DE TESTS:
//  ✓ src/features/leagues/components/FixtureTab.test.jsx (24 tests) 846ms
//    ✓ FixtureTab - estructura por rondas (5)
//      ✓ muestra una sección por cada ronda, en orden 217ms
//      ✓ agrupa dentro de la misma sección los partidos con el mismo round 70ms
//      ✓ muestra los nombres de local y visitante de cada partido 25ms
//      ✓ con fixture vacío no rompe y no dibuja rondas 6ms
//      ✓ con fixture null (antes de league_started) no rompe 10ms
//    ✓ FixtureTab - league_round_started (ronda en juego) (7)
//      ✓ resalta con 'En juego' solo la ronda actual 37ms
//      ✓ no muestra 'En juego' si no hay ronda en ejecución 10ms
//      ✓ mueve la etiqueta 'En juego' cuando cambia la ronda actual 43ms
//      ✓ marca JUGANDO solo los partidos incluidos en roundMatchIDs 22ms
//      ✓ habilita 'Ver partido' solo en los partidos en juego 36ms
//      ✓ sin roundMatchIDs (undefined) todos los botones quedan deshabilitados 36ms
//      ✓ mantiene los resultados previos al empezar una nueva ronda 26ms
//    ✓ FixtureTab - league_round_finished (partidos finalizados) (6)
//      ✓ muestra el badge FINALIZADO en los partidos terminados 21ms
//      ✓ muestra el marcador del partido finalizado 16ms
//      ✓ no muestra marcador en partidos que no están FINALIZADOS 9ms
//      ✓ no muestra badge FINALIZADO en partidos no finalizados 8ms
//      ✓ un partido finalizado no tiene el botón 'Ver partido' habilitado 22ms
//      ✓ pasa de JUGANDO a FINALIZADO al llegar el resultado (sin recargar) 31ms
//    ✓ FixtureTab - navegación (2)
//      ✓ al tocar 'Ver partido' navega a la vista de ese partido 77ms
//      ✓ un botón deshabilitado no navega 34ms
//    ✓ FixtureTab - robustez (eventos inconsistentes y reconexión) (4)
//      ✓ ignora un resultado con match_id inexistente en el fixture 19ms
//      ✓ ignora un id inexistente en roundMatchIDs 21ms
//      ✓ una ronda inexistente como actualRound no resalta ninguna sección 16ms
//      ✓ al reaplicar el mismo estado (reconexión) no duplica partidos ni badges 25ms

// ---------- Mock de navegación ----------
const navigateMock = vi.hoisted(() => vi.fn())

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => navigateMock }
})

// ---------- Datos (formato de league_started / league_round_finished) ----------
function buildMatch(id, round, local, visitante, state = "POR_COMENZAR") {
  return {
    match_id: id,
    match_order: id - 100,
    round,
    state,
    local: { club_id: 1, name: local },
    visitante: { club_id: 2, name: visitante },
  }
}

function buildFixture() {
  return [
    buildMatch(101, 1, "Los Pibes FC", "Atlético Sur"),
    buildMatch(102, 2, "Atlético Sur", "Deportivo Norte"),
    buildMatch(103, 3, "Deportivo Norte", "Los Pibes FC"),
  ]
}

const result101 = {
  match_id: 101,
  state: "FINALIZADO",
  score: { local: 2, visitante: 1 },
}

// ---------- Helpers ----------
function renderFixture(props = {}) {
  const defaults = {
    rawFixture: buildFixture(),
    actualRound: 0,
    roundMatchIDs: [],
    resultsMatchs: [],
  }

  const ui = (p) => (
    <MemoryRouter initialEntries={["/league/lobby/10/Liga"]}>
      <Routes>
        <Route
          path="/league/lobby/:id/:leagueName"
          element={<FixtureTab {...defaults} {...p} />}
        />
      </Routes>
    </MemoryRouter>
  )

  const utils = render(ui(props))
  return {
    ...utils,
    // simula una actualización por websocket (nuevas props, sin recargar)
    update: (nextProps) => utils.rerender(ui({ ...props, ...nextProps })),
  }
}

function roundSection(round) {
  return screen.getByRole("heading", { name: `Ronda ${round}` }).closest("section")
}

function watchButton(round) {
  return within(roundSection(round)).getByRole("button", { name: /ver partido/i })
}

beforeEach(() => {
  navigateMock.mockClear()
})

// =====================================================================
describe("FixtureTab - estructura por rondas", () => {
  it("muestra una sección por cada ronda, en orden", () => {
    renderFixture()

    const headings = screen.getAllByRole("heading").map((h) => h.textContent)
    expect(headings).toEqual(["Ronda 1", "Ronda 2", "Ronda 3"])
  })

  it("agrupa dentro de la misma sección los partidos con el mismo round", () => {
    renderFixture({
      rawFixture: [
        buildMatch(101, 1, "Los Pibes FC", "Atlético Sur"),
        buildMatch(102, 1, "Deportivo Norte", "Real Barrio"),
        buildMatch(103, 2, "Atlético Sur", "Deportivo Norte"),
      ],
    })

    expect(screen.getAllByRole("heading")).toHaveLength(2)
    expect(
      within(roundSection(1)).getAllByRole("button", { name: /ver partido/i })
    ).toHaveLength(2)
    expect(
      within(roundSection(2)).getAllByRole("button", { name: /ver partido/i })
    ).toHaveLength(1)
  })

  it("muestra los nombres de local y visitante de cada partido", () => {
    renderFixture()

    const round1 = within(roundSection(1))
    expect(round1.getByText("Los Pibes FC")).toBeInTheDocument()
    expect(round1.getByText("Atlético Sur")).toBeInTheDocument()
  })

  it("con fixture vacío no rompe y no dibuja rondas", () => {
    renderFixture({ rawFixture: [] })

    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("con fixture null (antes de league_started) no rompe", () => {
    expect(() => renderFixture({ rawFixture: null })).not.toThrow()
    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })
})

// =====================================================================
describe("FixtureTab - league_round_started (ronda en juego)", () => {
  it("resalta con 'En juego' solo la ronda actual", () => {
    renderFixture({ actualRound: 2, roundMatchIDs: [102] })

    expect(screen.getAllByText("En juego")).toHaveLength(1)
    expect(within(roundSection(2)).getByText("En juego")).toBeInTheDocument()
    expect(within(roundSection(1)).queryByText("En juego")).not.toBeInTheDocument()
    expect(within(roundSection(3)).queryByText("En juego")).not.toBeInTheDocument()
  })

  it("no muestra 'En juego' si no hay ronda en ejecución", () => {
    renderFixture({ actualRound: 0 })

    expect(screen.queryByText("En juego")).not.toBeInTheDocument()
  })

  it("mueve la etiqueta 'En juego' cuando cambia la ronda actual", () => {
    const { update } = renderFixture({ actualRound: 1, roundMatchIDs: [101] })
    expect(within(roundSection(1)).getByText("En juego")).toBeInTheDocument()

    update({ actualRound: 2, roundMatchIDs: [102] })

    expect(within(roundSection(1)).queryByText("En juego")).not.toBeInTheDocument()
    expect(within(roundSection(2)).getByText("En juego")).toBeInTheDocument()
  })

  it("marca JUGANDO solo los partidos incluidos en roundMatchIDs", () => {
    renderFixture({ actualRound: 2, roundMatchIDs: [102] })

    expect(screen.getAllByText("JUGANDO")).toHaveLength(1)
    expect(within(roundSection(2)).getByText("JUGANDO")).toBeInTheDocument()
  })

  it("habilita 'Ver partido' solo en los partidos en juego", () => {
    renderFixture({ actualRound: 2, roundMatchIDs: [102] })

    expect(watchButton(2)).toBeEnabled()
    expect(watchButton(1)).toBeDisabled()
    expect(watchButton(3)).toBeDisabled()
  })

  it("sin roundMatchIDs (undefined) todos los botones quedan deshabilitados", () => {
    renderFixture({ roundMatchIDs: undefined })

    expect(watchButton(1)).toBeDisabled()
    expect(watchButton(2)).toBeDisabled()
    expect(watchButton(3)).toBeDisabled()
  })

  it("mantiene los resultados previos al empezar una nueva ronda", () => {
    renderFixture({
      rawFixture: [
        buildMatch(101, 1, "Los Pibes FC", "Atlético Sur", "FINALIZADO"),
        buildMatch(102, 2, "Atlético Sur", "Deportivo Norte", "JUGANDO"),
        buildMatch(103, 3, "Deportivo Norte", "Los Pibes FC"),
      ],
      actualRound: 2,
      roundMatchIDs: [102],
      resultsMatchs: [result101],
    })

    expect(within(roundSection(1)).getByText("FINALIZADO")).toBeInTheDocument()
    expect(within(roundSection(1)).getByText("(2)")).toBeInTheDocument()
    expect(within(roundSection(1)).getByText("(1)")).toBeInTheDocument()
    expect(within(roundSection(2)).getByText("JUGANDO")).toBeInTheDocument()
  })
})

// =====================================================================
describe("FixtureTab - league_round_finished (partidos finalizados)", () => {
  const finishedFixture = () => [
    buildMatch(101, 1, "Los Pibes FC", "Atlético Sur", "FINALIZADO"),
    buildMatch(102, 2, "Atlético Sur", "Deportivo Norte"),
    buildMatch(103, 3, "Deportivo Norte", "Los Pibes FC"),
  ]

  it("muestra el badge FINALIZADO en los partidos terminados", () => {
    renderFixture({ rawFixture: finishedFixture(), resultsMatchs: [result101] })

    expect(screen.getAllByText("FINALIZADO")).toHaveLength(1)
    expect(within(roundSection(1)).getByText("FINALIZADO")).toBeInTheDocument()
  })

  it("muestra el marcador del partido finalizado", () => {
    renderFixture({ rawFixture: finishedFixture(), resultsMatchs: [result101] })

    const round1 = within(roundSection(1))
    expect(round1.getByText("(2)")).toBeInTheDocument() // local
    expect(round1.getByText("(1)")).toBeInTheDocument() // visitante
  })

  it("no muestra marcador en partidos que no están FINALIZADOS", () => {
    renderFixture({ rawFixture: buildFixture(), resultsMatchs: [] })

    expect(screen.queryByText(/^\(\d+\)$/)).not.toBeInTheDocument()
  })

  it("no muestra badge FINALIZADO en partidos no finalizados", () => {
    renderFixture({ rawFixture: buildFixture() })

    expect(screen.queryByText("FINALIZADO")).not.toBeInTheDocument()
  })

  it("un partido finalizado no tiene el botón 'Ver partido' habilitado", () => {
    renderFixture({
      rawFixture: finishedFixture(),
      resultsMatchs: [result101],
      roundMatchIDs: [],
    })

    expect(watchButton(1)).toBeDisabled()
  })

  it("pasa de JUGANDO a FINALIZADO al llegar el resultado (sin recargar)", () => {
    const playing = [
      buildMatch(101, 1, "Los Pibes FC", "Atlético Sur", "JUGANDO"),
      buildMatch(102, 2, "Atlético Sur", "Deportivo Norte"),
    ]
    const { update } = renderFixture({
      rawFixture: playing,
      actualRound: 1,
      roundMatchIDs: [101],
    })
    expect(screen.getByText("JUGANDO")).toBeInTheDocument()
    expect(watchButton(1)).toBeEnabled()

    update({
      rawFixture: [
        buildMatch(101, 1, "Los Pibes FC", "Atlético Sur", "FINALIZADO"),
        buildMatch(102, 2, "Atlético Sur", "Deportivo Norte"),
      ],
      roundMatchIDs: [],
      resultsMatchs: [result101],
    })

    expect(screen.queryByText("JUGANDO")).not.toBeInTheDocument()
    expect(screen.getByText("FINALIZADO")).toBeInTheDocument()
    expect(watchButton(1)).toBeDisabled()
  })
})

// =====================================================================
describe("FixtureTab - navegación", () => {
  it("al tocar 'Ver partido' navega a la vista de ese partido", async () => {
    const user = userEvent.setup()
    renderFixture({ actualRound: 2, roundMatchIDs: [102] })

    await user.click(watchButton(2))

    expect(navigateMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith("/matches/102", {
      state: { from: "/league/lobby/10/Liga" },
    })
  })

  it("un botón deshabilitado no navega", async () => {
    const user = userEvent.setup()
    renderFixture({ actualRound: 2, roundMatchIDs: [102] })

    await user.click(watchButton(1))

    expect(navigateMock).not.toHaveBeenCalled()
  })
})

// =====================================================================
describe("FixtureTab - robustez (eventos inconsistentes y reconexión)", () => {
  it("ignora un resultado con match_id inexistente en el fixture", () => {
    renderFixture({
      resultsMatchs: [
        { match_id: 999, state: "FINALIZADO", score: { local: 5, visitante: 5 } },
      ],
    })

    expect(screen.getAllByRole("heading")).toHaveLength(3)
    expect(screen.queryByText("(5)")).not.toBeInTheDocument()
    expect(screen.queryByText("FINALIZADO")).not.toBeInTheDocument()
  })

  it("ignora un id inexistente en roundMatchIDs", () => {
    renderFixture({ actualRound: 1, roundMatchIDs: [999] })

    expect(screen.queryByText("JUGANDO")).not.toBeInTheDocument()
    expect(watchButton(1)).toBeDisabled()
  })

  it("una ronda inexistente como actualRound no resalta ninguna sección", () => {
    renderFixture({ actualRound: 99 })

    expect(screen.queryByText("En juego")).not.toBeInTheDocument()
    expect(screen.getAllByRole("heading")).toHaveLength(3)
  })

  it("al reaplicar el mismo estado (reconexión) no duplica partidos ni badges", () => {
    const props = {
      rawFixture: [
        buildMatch(101, 1, "Los Pibes FC", "Atlético Sur", "FINALIZADO"),
        buildMatch(102, 2, "Atlético Sur", "Deportivo Norte"),
        buildMatch(103, 3, "Deportivo Norte", "Los Pibes FC"),
      ],
      resultsMatchs: [result101, result101], // resultado repetido
    }
    const { update } = renderFixture(props)

    update(props) // el historial se reenvía y se reaplica

    expect(screen.getAllByRole("button", { name: /ver partido/i })).toHaveLength(3)
    expect(screen.getAllByText("FINALIZADO")).toHaveLength(1)
    expect(screen.getAllByText("(2)")).toHaveLength(1)
  })
})
 describe("FixtureTab - espera entre rondas", () => {
  it("identifica las rondas pendientes antes de la primera ronda", () => {
    renderFixture()
    expect(screen.getAllByText("Pendiente")).toHaveLength(3)
    expect(screen.getByRole("status")).toHaveTextContent("Esperando el inicio de la ronda 1.")
  })

  it("al terminar una ronda muestra la siguiente pendiente aunque actualRound conserve la anterior", () => {
    const { update } = renderFixture({ actualRound: 1, roundMatchIDs: [101] })
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    update({
      rawFixture: [
        buildMatch(101, 1, "Los Pibes FC", "Atlético Sur", "FINALIZADO"),
        buildMatch(102, 2, "Atlético Sur", "Deportivo Norte"),
      ],
      roundMatchIDs: [],
    })
    expect(within(roundSection(1)).getByText("Finalizada")).toBeInTheDocument()
    expect(within(roundSection(2)).getByText("Pendiente")).toBeInTheDocument()
    expect(screen.queryByText("En juego")).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("Esperando el inicio de la ronda 2.")
  })

  it("no anuncia otra ronda cuando todos los partidos finalizaron", () => {
    renderFixture({ rawFixture: [buildMatch(101, 1, "A", "B", "FINALIZADO")] })
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    expect(screen.queryByText("Pendiente")).not.toBeInTheDocument()
  })
})
