import { api } from "./api";


export async function gerarNovoPallet(arquivoId: number): Promise<string> {
    try {
        const response = await api.post("/pallet",null, 
            {params: {arquivoId}
        });
        return response.data;
    } catch (error) {
        throw error;

    }

}

// Lista pallets existentes do arquivo
export async function listarPallets(arquivoId: number): Promise<string[]> {

    try {
        const response = await api.get("/pallet", 
            {params : {arquivoId}
        });
        return response.data;
    } catch (error) {

        throw error;

    }

}