import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { LobbyUsers } from "./LobbyUsers"

// Mock de Avatar para aislar el componente
vi.mock("../../../shared/components/Avatar", () => ({
  Avatar: ({ avatar, name, clubId }) => (
    <div
      data-testid="avatar"
      data-avatar={avatar}
      data-name={name}
      data-club-id={clubId}
    />
  ),
}))

const users = [
  { user_name: "Luca", avatar: "luca.png", club_id: 1 },
  { user_name: "Mati", avatar: "mati.png", club_id: 2 },
  { user_name: "Sofi", avatar: "sofi.png", club_id: 3 },
]

describe("LobbyUsers", () => {
  it("renderiza una tarjeta por cada usuario", () => {
    render(<LobbyUsers users={users} />)
    expect(screen.getAllByTestId("avatar")).toHaveLength(3)
  })

  it("muestra el nombre de cada usuario", () => {
    render(<LobbyUsers users={users} />)
    users.forEach(({ user_name }) => {
      expect(screen.getByText(user_name)).toBeInTheDocument()
    })
  })

  it("pasa avatar, name y clubId correctos al Avatar", () => {
    render(<LobbyUsers users={[users[0]]} />)
    const avatar = screen.getByTestId("avatar")
    expect(avatar).toHaveAttribute("data-avatar", "luca.png")
    expect(avatar).toHaveAttribute("data-name", "Luca")
    expect(avatar).toHaveAttribute("data-club-id", "1")
  })

  it("no renderiza tarjetas si la lista está vacía", () => {
    render(<LobbyUsers users={[]} />)
    expect(screen.queryByTestId("avatar")).not.toBeInTheDocument()
  })

  it("respeta el orden de los usuarios", () => {
    render(<LobbyUsers users={users} />)
    const names = screen
      .getAllByText(/Luca|Mati|Sofi/)
      .map((el) => el.textContent)
    expect(names).toEqual(["Luca", "Mati", "Sofi"])
  })
})