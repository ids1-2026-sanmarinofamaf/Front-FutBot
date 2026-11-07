// TablaTab.test.jsx
import { describe, it, expect } from "vitest"
import { render, screen, within } from "@testing-library/react"
import TablaTab from "./TablaTab"

const club = (overrides = {}) => ({
  club_id: 1,
  name: "Club",
  points: 0,
  matches_played: 0,
  matches_won: 0,
  matches_drawn: 0,
  matches_lost: 0,
  goals_for: 0,
  goals_against: 0,
  goal_difference: 0,
  ...overrides,
})

// Estado inicial (league_started) y estado tras league_round_finished (eventos.md)
const initialStandings = [
  club({ club_id: 1, name: "Los Pibes FC" }),
  club({ club_id: 2, name: "Atlético Sur" }),
  club({ club_id: 3, name: "Deportivo Norte" }),
]

const afterRound1 = [
  club({
    club_id: 1, name: "Los Pibes FC", points: 3, matches_played: 1, matches_won: 1,
    goals_for: 2, goals_against: 1, goal_difference: 1,
  }),
  club({
    club_id: 2, name: "Atlético Sur", points: 0, matches_played: 1, matches_lost: 1,
    goals_for: 1, goals_against: 2, goal_difference: -1,
  }),
  club({ club_id: 3, name: "Deportivo Norte" }),
]

// Helpers: filas del tbody (sin el encabezado) y celdas de una fila
const getRows = () => screen.getAllByRole("row").slice(1)
const cells = (row) => within(row).getAllByRole("cell").map((c) => c.textContent)
const clubNames = () => getRows().map((r) => cells(r)[1])

describe("TablaTab", () => {
  it("muestra los encabezados de todas las columnas", () => {
    render(<TablaTab standings={initialStandings} />)
      ;["#", "Nombre", "PTS", "PJ", "PG", "PE", "PP", "GF", "GC", "DG"].forEach((h) => {
        expect(screen.getByRole("columnheader", { name: h })).toBeInTheDocument()
      })
  })

  it("muestra la tabla inicial con una fila por club", () => {
    render(<TablaTab standings={initialStandings} />)
    expect(getRows()).toHaveLength(3)
    expect(clubNames()).toEqual(["Los Pibes FC", "Atlético Sur", "Deportivo Norte"])
  })

  it("muestra todos los campos de cada club tal como los manda el back", () => {
    render(<TablaTab standings={[afterRound1[0]]} />)
    // [#, Nombre, PTS, PJ, PG, PE, PP, GF, GC, DG]
    expect(cells(getRows()[0])).toEqual(
      ["1", "Los Pibes FC", "3", "1", "1", "0", "0", "2", "1", "1"]
    )
  })

  it("muestra la diferencia de gol negativa", () => {
    render(<TablaTab standings={[afterRound1[1]]} />)
    expect(cells(getRows()[0])[9]).toBe("-1")
  })

  it("ordena por puntos de mayor a menor", () => {
    const standings = [
      club({ club_id: 1, name: "A", points: 1 }),
      club({ club_id: 2, name: "B", points: 6 }),
      club({ club_id: 3, name: "C", points: 3 }),
    ]
    render(<TablaTab standings={standings} />)
    expect(clubNames()).toEqual(["B", "C", "A"])
  })

  it("desempata por diferencia de gol", () => {
    const standings = [
      club({ club_id: 1, name: "A", points: 3, goal_difference: 1 }),
      club({ club_id: 2, name: "B", points: 3, goal_difference: 4 }),
    ]
    render(<TablaTab standings={standings} />)
    expect(clubNames()).toEqual(["B", "A"])
  })

  it("si empatan en puntos y diferencia de gol, desempata por goles a favor", () => {
    const standings = [
      club({ club_id: 1, name: "A", points: 3, goal_difference: 1, goals_for: 2 }),
      club({ club_id: 2, name: "B", points: 3, goal_difference: 1, goals_for: 5 }),
    ]
    render(<TablaTab standings={standings} />)
    expect(clubNames()).toEqual(["B", "A"])
  })

  it("numera la posición según el orden mostrado, no el recibido", () => {
    const standings = [
      club({ club_id: 1, name: "A", points: 0 }),
      club({ club_id: 2, name: "B", points: 9 }),
      club({ club_id: 3, name: "C", points: 4 }),
    ]
    render(<TablaTab standings={standings} />)
    const rows = getRows().map(cells)
    expect(rows.map((r) => r[0])).toEqual(["1", "2", "3"])
    expect(rows.map((r) => r[1])).toEqual(["B", "C", "A"])
  })

  it("no muta el array standings recibido por props", () => {
    const standings = [
      club({ club_id: 1, name: "A", points: 0 }),
      club({ club_id: 2, name: "B", points: 9 }),
    ]
    const copy = [...standings]
    render(<TablaTab standings={standings} />)
    expect(standings).toEqual(copy)
  })

  it("reemplaza la tabla y actualiza el orden cuando cambian los standings (league_round_finished)", () => {
    const { rerender } = render(<TablaTab standings={initialStandings} />)
    expect(clubNames()).toEqual(["Los Pibes FC", "Atlético Sur", "Deportivo Norte"])

    rerender(<TablaTab standings={afterRound1} />)
    // Los Pibes (3 pts), Deportivo Norte (0 pts, DG 0), Atlético Sur (0 pts, DG -1)
    expect(clubNames()).toEqual(["Los Pibes FC", "Deportivo Norte", "Atlético Sur"])
    expect(getRows()).toHaveLength(3)
  })

  it("no duplica filas al recibir nuevos standings", () => {
    const { rerender } = render(<TablaTab standings={initialStandings} />)
    rerender(<TablaTab standings={afterRound1} />)
    rerender(<TablaTab standings={afterRound1} />)
    expect(getRows()).toHaveLength(3)
  })

  it("no rompe y no muestra filas con standings vacíos o sin prop", () => {
    const { rerender } = render(<TablaTab standings={[]} />)
    expect(getRows()).toHaveLength(0)

    rerender(<TablaTab />)
    expect(getRows()).toHaveLength(0)
  })

  it("permite desplazarse cuando hay muchos equipos", () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      club({ club_id: i + 1, name: `Club ${i + 1}`, points: i })
    )
    const { container } = render(<TablaTab standings={many} />)
    expect(getRows()).toHaveLength(30)
    expect(container.firstChild).toHaveClass("overflow-y-auto")
  })
})