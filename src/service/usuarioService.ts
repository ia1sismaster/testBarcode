import { api } from "./api";
import type { LoginRequest, UsuarioResponse, RegistroRequest } from "../types/auth"; // ou defina aqui mesmo
import { getUsuarioId } from "./arquivoService";



export async function login(email: string, senha: string): Promise<UsuarioResponse> {
    try {
        // 1. Montamos o objeto JSON (Nada de FormData!)
        const payload: LoginRequest = {
            email: email,
            senha: senha
        };

        // 2. Chamada POST
        // Ajuste a URL para bater EXATAMENTE com seu Controller (/api/usuario/login)
        const response = await api.post<UsuarioResponse>("/usuario/login", payload, {
            timeout: 60000,
        });

        // 3. Salvando o Token (O Passo mais importante)
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
            // Opcional: Salvar ID do usuário se precisar usar depois
            localStorage.setItem("usuarioId", response.data.usuarioId.toString());
            localStorage.setItem("user_email", response.data.email);
            localStorage.setItem("user_nome", response.data.nome);
        }

        return response.data;

    } catch (error) {
        // Log para debug
        console.error("Erro ao logar:", error);
        // Repassa o erro para a tela (Login.tsx) poder mostrar o aviso vermelho
        throw error;
    }
}

export async function registrar(nome: string, email: string, senha: string): Promise<UsuarioResponse> {

    try {

        const payload: RegistroRequest = {
            nome: nome,
            email: email,
            senha: senha
        }
        const response = await api.post<UsuarioResponse>("/usuario/cadastro", payload);
        console.log("ERRO -> ", response)

        return response.data;

    } catch (error) {
        // Log para debug
        console.error("Erro ao logar:", error);
        // Repassa o erro para a tela (Login.tsx) poder mostrar o aviso vermelho
        throw error;
    }

}

export async function obterPerfil() {
    try {
        const response = await api.get("/usuario/obter-perfil");
        return response.data;
    } catch (error) {
        console.log("Falha para obter perfil", error);

    }

}

export async function atualizarPerfil(dados: { nome: string; email: string; percentualEscape: number }) {

    try {
        const response = await api.put("/usuario/perfil", dados);
        return response.data;
    } catch (error) {
        console.log("Erro ao atualizar perfil", error);

    }
}

export async function atualizarSenha(dados: { senhaAtual: string; novaSenha: string }) {
    try {
        const response = await api.put("/usuario/senha", dados);
        return response.data;
    } catch (error) {
        console.log("Error ao atualizar senha", error);
    }
}

export async function uploadLogo(arquivo: File) {

    try {
        const formData = new FormData();
        formData.append("arquivo", arquivo);

        const response = await api.post("/usuario/logo", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    } catch (error) {
        console.log("Falha no upload da Logo", error);

    }

}


export async function definirImpressora(impressoraId: number) {

    try {
        const response = await api.post(`/usuario/definir-impressora`, null,
            {
                params: {
                    impressoraId
                }
            });
        return response.data;
    } catch (error) {

    }

}


// Função utilitária para deslogar
export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioId");
    localStorage.removeItem("user_nome");
    localStorage.removeItem("user_nome");
    window.location.href = "/login";
}

// Função para checar se está logado (útil para proteger rotas)
export function isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
}




