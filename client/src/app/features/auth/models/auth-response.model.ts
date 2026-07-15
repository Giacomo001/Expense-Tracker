export interface AuthResponse {
    accessToken: string;
    //refreshToken: string; //IMPORTANT: The DTO should NOT contain the refresh token
    userName: string;
    email: string;
}