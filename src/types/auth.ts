// O que enviamos para o Java
export interface LoginRequest {
  email: string;
  senha?: string; // Opcional porque no cadastro usa, mas aqui é login
}

// O que o Java devolve (baseado no seu UsuarioResponseDto)
export interface UsuarioResponse {
  token: string;
  usuarioId: number;
  msg: string;
  status: string;
  nome: string;
  email: string;

}

export interface RegistroRequest{
    nome: string;
    email: string;
    senha: string;
    // valor do plano
}