import { useNavigate } from "react-router-dom";

export function JoinMatchButton({ matchId }) {
  const navigate = useNavigate();

  const handleGoToMatch = () => {
    // Redirige a la ruta definida en AppRouter pasando el ID real del partido
    navigate(`/matches/${matchId}`, { replace: true });
  };

  return (
    <button
      onClick={handleGoToMatch}
      className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-extrabold text-xl transition-colors shadow-blue-500/30 shadow-lg animate-pulse"
    >
      ENTRAR A LA CANCHA
    </button>
  );
}