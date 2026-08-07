import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useErpAuth } from "@/contexts/ErpAuthContext";
import { Loader2 } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663539257200/nE9aRDyk9G49cwSdfYmqny/LOGOPRINCIPAL-POSITIVA-HORIZONTAL_21b11a41.webp";

export default function ErpLogin() {
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const { setErpUser } = useErpAuth();
  const loginMutation = trpc.vendedores.login.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nome || !senha) { setError("Preencha usuário e senha."); return; }
    try {
      const result = await loginMutation.mutateAsync({ nome, senha });
      if (result.success && result.vendedor) {
        setErpUser(result.vendedor as any);
      } else {
        setError(result.error || "Falha no login");
      }
    } catch (err: any) {
      setError("Erro ao conectar. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Card className="w-full max-w-md shadow-2xl border-0 mx-4 sm:mx-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            <img src={LOGO_URL} alt="Garden Center Primavera" className="h-20 object-contain" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">Sistema de Gestão Comercial</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Usuário</label>
              <Input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Digite seu usuário"
                className="mt-1 h-11 text-base"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Senha</label>
              <Input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="mt-1 h-11 text-base"
              />
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            <Button type="submit" className="w-full h-11 text-base" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
