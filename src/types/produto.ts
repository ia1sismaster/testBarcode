export interface AtualizarPrecoRequest {
    produtoId: number;
    novoValor: number;
}

export interface ResponseProduto {
    idProduto: number;
    nome: string;
    condicao: string;
    codPallet: string;
    codBarras: string;
    custo: number;
    precoVenda: number;
    qtdProduto: number;
    precoMercadoLivre: string;
    status: string;
    categoria: string;
    link: string;
    foiImpresso: Boolean;
}

export interface EditarProdutoDto {
    nomeProduto: string
    precoMl : string
    precoMlDesc: string
    link: string
    custo: number
    qtdProduto: number
    precoVenda: number
    condicao: string
    codPallet: string
    categoria: string

}