export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
          Futbot
        </h1>
        <h2 className="text-xl font-semibold text-slate-300">
          San Marino Famaf
        </h2>
        <div className="mt-6 pt-6 border-t border-slate-700">
          <p className="text-sm text-slate-400">
            Nuestro Hola mundo inicializado correctamente.
          </p>
          <p className="text-sm text-slate-400">
            Hoy 26 de septiembre, San Marino vs Finlandia.
          </p>
        </div>
      </div>
    </div>
  )
}