import { useNavigate } from "react-router-dom";

export function JoinMatchButton({ matchId }) {
  const navigate = useNavigate();

  const handleGoToMatch = () => {
    console.log(`Lógica de unión manual al partido: ${matchId}`);
    // La implementación final se realizará en un ticket posterior
    navigate("/match", { replace: true });
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