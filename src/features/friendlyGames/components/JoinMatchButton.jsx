import { useNavigate } from "react-router-dom";

export function JoinMatchButton({ matchId, disabled = false }) {
  const navigate = useNavigate();

  const handleGoToMatch = () => {
    if (disabled) return;
    // Redirige a la ruta definida en AppRouter pasando el ID real del partido
    navigate(`/matches/${matchId}`, { replace: true, state: { from: "/friendly" } });
  };

  return (
    <button
      onClick={handleGoToMatch}
      disabled={disabled}
      className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-extrabold text-xl transition-colors shadow-blue-500/30 shadow-lg animate-pulse disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none disabled:animate-none"
    >
      ENTRAR A LA CANCHA
    </button>
  );
}