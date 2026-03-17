import { api } from "./api";
import type { CriarTarefa, LoteRequest, ReturnTarefaDto, SaveTarefaManualDto, ProdutoManualPage } from "../types/lote";
import type { ResponseProduto } from "../types/produto";



export async function criarLote(loteRequest: LoteRequest): Promise<void> {
    try {
        const response = await api.post("/lote/cadastro", loteRequest);
        return response.data;
    } catch (error) {
        console.error("Erro ao criar lote:", error);
        throw error;
    }
}


export async function listarLotes() {

    try {
        
        const response = await api.get("/lote/listar");
        
        return response.data;

    } catch (error) {
      throw "Erro ao listar lote : "+error;
        
    }
 
    
}

export async function buscarResumoLote() {
  try {
    const response = await api.get("/lote/resumo");

    console.log("RESUMO: ",response)
    return response.data;
  } catch (error) {
    throw error;
  }
  
}

export async function editarLote(arquivoId: number, payload: LoteRequest): Promise<void> {
  try {
     await api.patch(`/lote/${arquivoId}`, payload);
  } catch (error) {
    throw error
    
  }
   
}

export async function mudarStatusLote(arquivoId: number, acao: number): Promise<void> {

  try {
     await api.put(`/lote/mudar-status/${arquivoId}?acao=${acao}`);
  } catch (error) {
    throw error
  }
   
}


////////////////////////


export async function criarTarefa(dto: CriarTarefa, arquivoId: number): Promise<number> {
  try {
    const response = await api.post("/lote/criar-tarefa", dto, {
      params: { arquivoId }
    });
    return response.data; // retorna idTarefa (Long)
  } catch (error) {
    throw error;
  }
}

export async function consultarStatusTarefa(tarefaId: number): Promise<ReturnTarefaDto> {
  try {
    const response = await api.get(`/lote/status/${tarefaId}`);

    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function gerarProduto(dto: SaveTarefaManualDto): Promise<ResponseProduto> {
  try {
    const response = await api.post("/lote/gerar-produto", dto);
    return response.data;
  } catch (error) {
    throw error;
  }

}


export async function listarProdutosManuais(
  arquivoId: number,
  page: number = 0,
  size: number = 50,
  search?: string,
  pallet?: string,
  condicao?: string,
  categoria?: string
): Promise<ProdutoManualPage> {
  try {
    const response = await api.get("/produto/lote-manual", {
      params: {
        arquivoId,
        page,
        size,
        ...(search    && { search }),
        ...(pallet    && { pallet }),
        ...(condicao  && { condicao }),
        ...(categoria && {categoria})
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
}


export async function cancelarTarefa(tarefaId: number): Promise<void> {
  try {
    await api.delete(`/lote/cancelar-tarefa/${tarefaId}`);
  } catch (error) {
    throw error;
  }
}

export async function verificarBarcodeExistente(
    arquivoId: number, 
    termo: string,
    refBusca: string
): Promise<ResponseProduto | null> {
    const response = await api.get("/produto/verificar-termo", {
        params: { arquivoId, termo, refBusca },
        validateStatus: (status) => status === 200 || status === 204
    });
    return response.status === 204 ? null : response.data;
}

export async function adicionarQuantidade(
    idProduto: number, 
    quantidade: number
): Promise<void> {
    await api.post("/produto/adicionar-quantidade", null, {
        params: { idProduto, quantidade }
    });

}

export async function getFiltrosComQuantidade(arquivoId: number) {

    try {
        const response = await api.get("/lote/filtros",{
            params: {
                arquivoId: arquivoId
            }
        });
        return response.data;
    } catch (error) {
        throw error
        
    }
    
}
