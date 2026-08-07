/**
 * Serviço de integração com Bling ERP
 * Responsável por sincronizar pedidos, produtos e estoque
 */



const BLING_BASE_URL = "https://bling.com.br/Api/v2";

interface BlingConfig {
  apiKey: string;
}

interface BlingPedido {
  numero: string;
  data: string;
  cliente: {
    nome: string;
    email?: string;
    telefone?: string;
  };
  itens: Array<{
    descricao: string;
    quantidade: number;
    valor: number;
  }>;
  observacoes?: string;
}

/**
 * Faz uma requisição autenticada para a API do Bling
 */
export async function blingRequest(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  data?: any,
  apiKey?: string
) {
  const key = apiKey || process.env.BLING_API_KEY;
  if (!key) {
    throw new Error("BLING_API_KEY não configurada");
  }

  const url = `${BLING_BASE_URL}${endpoint}?apikey=${key}`;

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Bling API error: ${response.status} - ${errorText}`
    );
  }

  return response.json();
}

/**
 * Sincroniza um pedido do Garden para o Bling
 */
export async function sincronizarPedidoBling(
  pedidoData: BlingPedido,
  apiKey: string
) {
  try {
    // Formatar dados para o padrão do Bling
    const blingPedido = {
      numero: pedidoData.numero,
      data: pedidoData.data,
      cliente: {
        nome: pedidoData.cliente.nome,
        email: pedidoData.cliente.email,
        telefone: pedidoData.cliente.telefone,
      },
      itens: pedidoData.itens.map((item) => ({
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor: item.valor,
      })),
      observacoes: pedidoData.observacoes,
    };

    // Enviar para Bling
    const resultado = await blingRequest(
      "/pedidos",
      "POST",
      blingPedido,
      apiKey
    );

    return {
      sucesso: true,
      blingId: resultado.retorno?.pedidos?.[0]?.id,
      dados: resultado,
    };
  } catch (erro) {
    return {
      sucesso: false,
      erro: erro instanceof Error ? erro.message : "Erro desconhecido",
    };
  }
}

/**
 * Obtém pedidos do Bling
 */
export async function obterPedidosBling(apiKey: string, filtros?: any) {
  try {
    let endpoint = "/pedidos";
    if (filtros) {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
    }

    const resultado = await blingRequest(endpoint, "GET", undefined, apiKey);
    return {
      sucesso: true,
      pedidos: resultado.retorno?.pedidos || [],
    };
  } catch (erro) {
    return {
      sucesso: false,
      erro: erro instanceof Error ? erro.message : "Erro desconhecido",
    };
  }
}

/**
 * Obtém estoque do Bling
 */
export async function obterEstoqueBling(apiKey: string) {
  try {
    const resultado = await blingRequest("/depositos", "GET", undefined, apiKey);
    return {
      sucesso: true,
      depositos: resultado.retorno?.depositos || [],
    };
  } catch (erro) {
    return {
      sucesso: false,
      erro: erro instanceof Error ? erro.message : "Erro desconhecido",
    };
  }
}

/**
 * Sincroniza produtos do Bling para o Garden
 */
export async function sincronizarProdutosDoBling(apiKey: string) {
  try {
    const resultado = await blingRequest("/produtos", "GET", undefined, apiKey);
    return {
      sucesso: true,
      produtos: resultado.retorno?.produtos || [],
    };
  } catch (erro) {
    return {
      sucesso: false,
      erro: erro instanceof Error ? erro.message : "Erro desconhecido",
    };
  }
}

/**
 * Testa a conexão com a API do Bling
 */
export async function testarConexaoBling(apiKey: string) {
  try {
    // Tentar fazer uma requisição simples para validar a chave
    const resultado = await blingRequest("/depositos", "GET", undefined, apiKey);
    return {
      sucesso: true,
      mensagem: "Conexão com Bling estabelecida com sucesso",
    };
  } catch (erro) {
    return {
      sucesso: false,
      erro: erro instanceof Error ? erro.message : "Erro desconhecido",
    };
  }
}
