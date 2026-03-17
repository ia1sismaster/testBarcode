import { api } from "./api";

export interface FiltrosTarefa {
  search?: string;
  pallet?: string;
  condicao?: string;
  status?: string;        // StatusRaspagem
  statusRevisao?: string; // StatusRevisao
}

// Interface de Paginação
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export async function listarTarefasPorId(
    arquivoId: string, 
    page: number = 0, 
    filtros: FiltrosTarefa = {}
) {
    try {
        const response = await api.get("/tarefa/listar", { // Ajuste URL se necessário
            params: {
                arquivoId: arquivoId,
                page: page,
                size: 50, // Tamanho da página
                
                // Filtros opcionais
                search: filtros.search || undefined,
                pallet: filtros.pallet || undefined,
                condicao: filtros.condicao || undefined,
                status: filtros.status || undefined,
                statusRevisao: filtros.statusRevisao || undefined
            },
            timeout: 60000 
        });
        console.log(response.data);
        return response.data; // Retorna Page<TarefasResponseDto>

    } catch (error) {
        console.error("Erro ao listar tarefas:", error);
        throw error;
    }
}

export async function obterResumo(arquivoId:string) {

    try {
        const response = await api.get("/tarefa/resumo",{
            params:{
                arquivoId: arquivoId
            }
        });
        return response.data;

    } catch (error) {

        console.error("Error ao obter resumo da tarefa", error);
        throw error;
        
    }
    
}


export async function reprocessarBloqueados(arquivoId:String) {

    try {
        
        const response = await api.get("/tarefa/liberar-bloqueado", {params:{
            arquivoId: arquivoId
        }});

        return response.data;
    } catch (error) {
        console.error("Erro ao liberar bloqueados: ",error);
        throw error;
    }
    
}

export interface CorrecaoSimilarDto {
    tarefaId: number;
    titulo: string;
    preco: string;
    precoDesc: string;
    precoSugerido: number;
    
    
    link: string;
}

export async function escolherCandidato(tarefaId: number, candidatoId: number) {
  try {
    const response = await api.post("/tarefa/escolher-candidato",null, {params:{
      tarefaId,
      candidatoId
    }});
    return response.data;
  } catch (error) {
    console.error("Erro ao escolher candidato:", error);
    throw error;
  }
}

export async function aprovarSimilar(tarefaId: number) {
    try {
        const response = await api.put(`/tarefa/aprovar-similiar`, null, { 
            params: {tarefaId } 
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao aprovar similar:", error);
        throw error;
    }
}

export async function corrigirSimilar(dto: CorrecaoSimilarDto) {
    try {
        const response = await api.put("/tarefa/correcao-similar", dto);
        return response.data;
    } catch (error) {
        console.error("Erro ao corrigir similar:", error);
        throw error;
    }
}