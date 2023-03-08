
export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

export const getAccessToken = (): string | null =>
    localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = (): string | null =>
    localStorage.getItem(REFRESH_TOKEN_KEY);
export const setAccessToken = (token: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
};
export const setRefreshToken = (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
};
export const removeAccessToken = (): void =>
    localStorage.removeItem(ACCESS_TOKEN_KEY);