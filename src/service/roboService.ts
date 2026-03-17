import { api } from "./api";

export async function baixarExe() {
    
    try {
        const response = await api.get("/exe",{
            params:{nomeArquivo: "main.exe"},
            responseType: 'blob',
        
            timeout: 0, 
            
            // Dica de UX: Você pode acompanhar o progresso assim:
            onDownloadProgress: (progressEvent) => {
                const total = progressEvent.total || 1;
                const current = progressEvent.loaded;
                const percent = Math.round((current / total) * 100);
                console.log(`Download: ${percent}%`);
                // Aqui você poderia atualizar um estado para mostrar uma barra de progresso na tela
            }
        });

        const blob = new Blob([response.data], { type: 'application/octet-stream' });

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
    
        link.download = "Siscrap.exe"; 

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Erro ao baixar o robô:", error);
        throw error;
    }

}

export async function mudarStatus() {

        const usuarioId = localStorage.getItem("usuarioId");

        try {
            const response = await api.put("/comandos/mudar-status", null ,{
                    params:{usuarioId : usuarioId}
                }
            )

            return response.status

        } catch (error) {
            console.log("Erro ao mudar Status");
            throw error
        }
        
    }

export async function pegarStatus() {
    const usuarioId = localStorage.getItem("usuarioId");

    try {
        const response = await api.get("/comandos/status-site",{
            params: {usuarioId: usuarioId}
        });

        return response.data.status;

    } catch (error) {
        console.log("Erro ao pegar Status");
        return false;
        
    }
    
}