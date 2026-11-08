import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getLeagueRoster, updateLeagueRoster } from "./api"

// ✓ API de alineación de liga (11)
//      ✓ GET consulta solo la liga indicada con el token de sesión 3ms
//      ✓ PUT envía una única petición autenticada con formación y los seis jugadores 2ms
//      ✓ propaga status y mensaje HTTP 400 sin reintentar 2ms
//      ✓ propaga status y mensaje HTTP 401 sin reintentar 2ms
//      ✓ propaga status y mensaje HTTP 403 sin reintentar 1ms
//      ✓ propaga status y mensaje HTTP 404 sin reintentar 0ms
//      ✓ propaga status y mensaje HTTP 409 sin reintentar 0ms
//      ✓ propaga status y mensaje HTTP 422 sin reintentar 0ms
//      ✓ propaga status y mensaje HTTP 500 sin reintentar 1ms
//      ✓ propaga un error del GET 1ms
//      ✓ propaga un error de conexión del PUT 1ms

vi.mock("../auth/auth", () => ({ getToken: () => "test-token" }))

const payload = {
  formation: "offensive",
  players: Array.from({ length: 6 }, (_, index) => ({
    player_id: index + 1,
    is_starter: index < 3,
    slot: ["left", "center", "right"][index] ?? null,
    initial_behavior_id: index < 3 ? 1 : null,
  })),
}

let fetchMock

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => payload })
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => vi.unstubAllGlobals())

describe("API de alineación de liga", () => {
  
  it("GET consulta solo la liga indicada con el token de sesión", async () => {
    expect(await getLeagueRoster(150)).toEqual(payload)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/leagues\/150\/users\/me\/roster$/)
    expect(options.method).toBe("GET")
    expect(options.headers.Authorization).toBe("Bearer test-token")
    expect(options.body).toBeUndefined()
  })

  it("PUT envía una única petición autenticada con formación y los seis jugadores", async () => {
    expect(await updateLeagueRoster(151, payload)).toEqual(payload)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/leagues\/151\/users\/me\/roster$/)
    expect(options.method).toBe("PUT")
    expect(options.headers.Authorization).toBe("Bearer test-token")
    expect(options.headers["Content-Type"]).toBe("application/json")
    expect(JSON.parse(options.body)).toEqual(payload)
    expect(JSON.parse(options.body).players).toHaveLength(6)
  })

  it.each([400, 401, 403, 404, 409, 422, 500])("propaga status y mensaje HTTP %s sin reintentar", async status => {
    fetchMock.mockResolvedValue({ ok: false, status, json: async () => ({ detail: "Detalle backend" }) })
    await expect(updateLeagueRoster(150, payload)).rejects.toMatchObject({ status, message: "Detalle backend" })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("propaga un error del GET", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({ detail: "Liga inexistente" }) })
    await expect(getLeagueRoster(150)).rejects.toMatchObject({ status: 404, message: "Liga inexistente" })
  })

  it("propaga un error de conexión del PUT", async () => {
    const error = new TypeError("Failed to fetch")
    fetchMock.mockRejectedValue(error)
    await expect(updateLeagueRoster(150, payload)).rejects.toBe(error)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
