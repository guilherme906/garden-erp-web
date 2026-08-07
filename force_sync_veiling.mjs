import { executarSyncVeiling } from "./server/autoSync.ts";

console.log("🔄 Forçando sincronização do Veiling...");

try {
  const inicio = Date.now();
  await executarSyncVeiling();
  const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`✅ Sincronização concluída em ${duracao}s`);
  process.exit(0);
} catch (err) {
  console.error("❌ Erro durante sincronização:", err.message);
  process.exit(1);
}
