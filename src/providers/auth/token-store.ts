// Token store for managing access tokens across different auth providers
class TokenStore {
  private token: string | null = null;
  private provider: string | null = null;

  setToken(token: string | null, provider: string) {
    this.token = token;
    this.provider = provider;
  }

  getToken(): string | null {
    return this.token;
  }

  getProvider(): string | null {
    return this.provider;
  }

  clear() {
    this.token = null;
    this.provider = null;
  }
}

export const tokenStore = new TokenStore();
