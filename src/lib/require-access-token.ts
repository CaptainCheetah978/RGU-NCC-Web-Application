import { getAccessToken } from "./get-access-token";

export async function requireAccessToken() {
    const token = await getAccessToken();
    if (!token) throw new Error("Missing access token");
    return token;
}
