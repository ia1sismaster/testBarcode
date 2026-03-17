import { api } from "./api";
import type { AtualizarPrecoRequest, EditarProdutoDto } from "../types/produto";



export interface FiltrosProduto {
    search?: string;
    pallet?: string;
    condicao?: string;
}


export async function listarProdutos(
    idArquivo: number, 
    page: number = 0, 
    filters: FiltrosProduto = {} // Novo parâmetro opcional
) {
    try {
        const response = await api.get("/produto", { 
            params: { 
                arquivoId: idArquivo, // Nome tem que bater com @RequestParam do Java
                page, 
                size: 50,
                
                // Adicionando os filtros novos
                // Se estiver vazio ou undefined, o Axios geralmente ignora ou manda vazio,
                // o que o Spring aceita (required=false)
                search: filters.search || undefined,
                pallet: filters.pallet || undefined,
                condicao: filters.condicao || undefined
            },
            timeout: 0
        });
        
        return response.data; 

    } catch (error) {
        console.error("Erro ao listar produtos:", error);
        throw error;
    }
}

export interface ProdutoEtiqueta {
    idProduto: number;       
    nome: string;            
    codBarras: string;
    condicao: string;
    codPallet: string;
    custo: number;           
    precoVenda: number;      
    qtdProduto: number;
    precoMercadoLivre: string;
    status: string; 
    foiImpresso: Boolean;
}

export async function listarTodosProdutosEtiqueta(
  idArquivo: number,
  filtros: { pallet?: string; condicao?: string } = {}
): Promise<ProdutoEtiqueta[]> {
  const response = await api.get("/produto/todos", {
    params: {
      arquivoId: idArquivo,
      pallet: filtros.pallet || undefined,
      condicao: filtros.condicao || undefined,
    },
    timeout: 0
  });

  console.log(response);
  return response.data;
}

export async function atualizarPreco(lista: AtualizarPrecoRequest[]) {

    try {
        const response = await api.put("/produto/editar",lista)
        return response.data;
    } catch (error) {

        console.log("erro ao editar produto"+error)
        throw error;

        
    }

    
}

export async function infoSelecao(arquivoId: number) {

    try {
        const response = await api.get("produto/info-selecao",{
            params: {arquivoId}
        });

        return response.data;
    } catch (error) {
        
    }
    
}

export async function editarProduto(produtoId: number, dto: EditarProdutoDto): Promise<void> {

    try {
         await api.put(`/produto/${produtoId}`, dto);

    } catch (error) {
        
    }
   
}