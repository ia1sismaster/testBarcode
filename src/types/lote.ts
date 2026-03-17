
import type { ProdutoManual } from "../components/TaskManualTable";


export type RefBusca = "BARCODE" | "NOME";
export type StatusTarefa = "PENDENTE" | "EM_PROCESSAMENTO" | "SUCESSO" | "SIMILAR" | "NAO_ENCONTRADO" | "BLOQUEADO";
export type ModoBusca = "MENOR" | "MAIOR" | "MEDIO" | "TODOS";

export interface ProdutoManualPage {
  content: ProdutoManual[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface LoteRequest{
    nomeLote:string;
    observacao:string;
    modo: ModoBusca;
    minimoSimilar: number;
    porcDesc: number;
    porcCusto: number
}

export interface CriarTarefa {
  termo_busca: string;
  minimoSimilar: number;
  codMercadoLivre: string;  // sempre o barcode original
  refBusca: RefBusca;
}

export interface CandidatoDto {
  id: number;
  titulo: string;
  preco: string;
  precoDesconto: string;
  link: string;
  matchScore: number;
  escolhido: boolean;
}

export interface ReturnTarefaDto {
  nomeProduto: string;
  precoMl: string;
  precoMlDesc: string;
  url: string;
  porcDesc: number;
  porcCusto: number;
  categoria: string;
  status: StatusTarefa;
  candidatos: CandidatoDto[] | null;
}

export interface SaveTarefaManualDto {
  tarefaId: number;
  nomeProduto: string;
  preco: string;
  preco_desc: string;
  qtdProduto: number;
  custo_digitado: number;
  preco_venda: number;
  condicao: string;
  codPallet: string;
  categoria: string;
  link: string;
}

export interface ItemComQuantidadeDto{
    nome: string;
    qtd: number;
}

export interface FiltrosComQuantidadeDto{
    pallets: ItemComQuantidadeDto[];
    condicoes: ItemComQuantidadeDto[];
    categorias: ItemComQuantidadeDto[];
    
}

export interface ResumoLoteManualDto{
  qtdDisponivel: number;
  qtdEmCriacao: number;
  qtdVendido: number;
  valorDisponivel: number;
  valorEmCriacao: number;
  valorVendido: number;
}
