import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    
    if (token) {
        // Adiciona o cabeçalho Authorization: Bearer eyJhbG...
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 3. INTERCEPTOR DE RESPOSTA (Trata Token Inválido)
// Se o backend devolver erro, esse código roda:
api.interceptors.response.use(
    (response) => response, // Sucesso: passa direto
    (error) => {
        // Se o erro for 403 (Proibido) ou 401 (Não autorizado)
        if (error.response && (error.response.status === 403 || error.response.status === 401)) {
            // Significa que o token venceu ou é inválido
            localStorage.removeItem("token");
            localStorage.removeItem("usuarioId"); // Se estiver salvando ID
            
            // Força o logout redirecionando para a tela de login
            // Usamos window.location para limpar qualquer estado da memória do React
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);