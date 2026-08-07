import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export function LoginSimples() {
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [, setLocation] = useLocation();

  const loginMutation = trpc.vendedores.login.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const result = await loginMutation.mutateAsync({ nome, senha });
      
      if (result.success) {
        // Armazenar vendedor no localStorage
        localStorage.setItem("vendedor", JSON.stringify(result.vendedor));
        // Redirecionar para home
        setLocation("/");
      } else {
        setErro(result.error || "Erro ao fazer login");
      }
    } catch (err: any) {
      setErro(err.message || "Erro ao fazer login");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-white">🌿</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Garden Primavera</h1>
            <p className="text-gray-600 mt-2">Sistema ERP</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuário
              </label>
              <Input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu usuário"
                disabled={carregando}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                disabled={carregando}
                className="w-full"
              />
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{erro}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={carregando || !nome || !senha}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Rodapé */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Sistema de gestão para Garden Center Primavera
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
