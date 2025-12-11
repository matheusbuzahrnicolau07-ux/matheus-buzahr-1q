
import React, { useState } from 'react';
import { ChevronLeftIcon, MailIcon, LockIcon, EyeIcon, EyeSlashIcon } from './Icons';

interface AuthScreenProps {
  onLogin: (email: string, password: string, name?: string) => Promise<void>;
  onSkip: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onSkip }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
        setError("Preencha todos os campos obrigatórios.");
        setIsLoading(false);
        return;
    }

    if (!isLogin && !name) {
        setError("O nome é obrigatório para cadastro.");
        setIsLoading(false);
        return;
    }

    try {
        await onLogin(email, password, !isLogin ? name : undefined);
    } catch (err) {
        setError("Erro na autenticação. Tente novamente.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-8 justify-center animate-in fade-in duration-500 bg-zinc-950 relative">
        <button 
            onClick={onSkip} 
            className="absolute top-[calc(env(safe-area-inset-top)+2rem)] left-8 w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 active:scale-95 transition-transform border border-zinc-800"
        >
            <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <div className="mb-8">
            <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
                {isLogin ? "Bem vindo" : "Criar Conta"}
            </h2>
            <p className="text-zinc-500 text-lg">
                {isLogin ? "Entre para continuar seu progresso." : "Comece sua jornada saudável hoje."}
            </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 focus-within:border-emerald-500 transition-colors flex items-center gap-3">
                    <div className="text-zinc-500 pl-2">
                         {/* User Icon placeholder or generic */}
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent text-white focus:outline-none placeholder-zinc-600 font-bold" 
                        placeholder="Seu Nome" 
                    />
                </div>
            )}

            <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 focus-within:border-emerald-500 transition-colors flex items-center gap-3">
                <div className="text-zinc-500 pl-2">
                    <MailIcon className="w-5 h-5" />
                </div>
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-white focus:outline-none placeholder-zinc-600 font-bold" 
                    placeholder="Email" 
                    required 
                />
            </div>

            <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 focus-within:border-emerald-500 transition-colors flex items-center gap-3">
                <div className="text-zinc-500 pl-2">
                     <LockIcon className="w-5 h-5" />
                </div>
                <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-white focus:outline-none placeholder-zinc-600 font-bold" 
                    placeholder="Senha" 
                    required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-zinc-500 pr-2 hover:text-white">
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
            </div>
            
            {error && <p className="text-red-500 text-sm font-medium pl-1">{error}</p>}

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-emerald-500 text-black font-bold py-5 rounded-2xl shadow-lg shadow-emerald-500/20 mt-6 active:scale-[0.98] transition-all text-lg flex justify-center items-center"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                ) : (
                    isLogin ? "Entrar" : "Criar Conta"
                )}
            </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
                {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
                <button 
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError(null);
                    }} 
                    className="text-emerald-500 font-bold hover:underline"
                >
                    {isLogin ? "Cadastre-se" : "Faça Login"}
                </button>
            </p>
        </div>
    </div>
  );
};

export default AuthScreen;
