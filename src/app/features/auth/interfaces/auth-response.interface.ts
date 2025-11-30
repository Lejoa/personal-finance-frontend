export interface AuthResponse {
    token: string;
}

export interface AuthError {
    error: string;
    message: string;
}

export interface OAuthError {
    error: string;
    message: string;
}