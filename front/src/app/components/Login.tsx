import { useState } from "react";
import { Leaf, Mail, Lock, ArrowRight } from "lucide-react";

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-center relative">
      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 to-slate-900/90 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-md mx-4 sm:mx-auto p-6 sm:p-8 md:p-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-green-600 to-green-400 flex items-center justify-center shadow-lg shadow-green-900/50 mb-4 transform hover:scale-105 transition-transform duration-300">
            <Leaf size={32} className="text-white drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">PastoCerto</h1>
          <p className="text-green-100/70 text-sm font-medium tracking-wide">Gestão Inteligente de Pastagens</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-green-100/50 group-focus-within:text-green-400 transition-colors">
                <Mail size={20} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-green-100/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/50 transition-all duration-300"
                placeholder="Seu e-mail"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-green-100/50 group-focus-within:text-green-400 transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-green-100/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/50 transition-all duration-300"
                placeholder="Sua senha"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50 focus:ring-offset-0" />
              <span className="text-green-50/80 hover:text-white transition-colors">Lembrar de mim</span>
            </label>
            <a href="#" className="text-green-400 hover:text-green-300 transition-colors">Esqueceu a senha?</a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-xl font-semibold text-lg shadow-lg shadow-green-900/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Entrar no Sistema
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-green-50/60">
          Não tem uma conta? <a href="#" className="text-green-400 hover:text-green-300 font-medium transition-colors">Fale com um consultor</a>
        </div>
      </div>
    </div>
  );
}
