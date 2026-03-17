import { api } from "./api";

export async function getImpressora() {

    try {
        const response = await api.get("/impressora")
        console.log("IMPRESSORA: ",response.data)
        return response.data
    } catch (error) {
        
    }
    
}

export async function mudarProdutoImpresso(produtosIds : number[]) {
    try {
        await api.put("/impressora/tag-impresso", produtosIds);

    } catch (error) {
        throw error
    }
    
}