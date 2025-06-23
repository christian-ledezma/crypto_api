export interface Cryptocurrency {
  id: number;
  symbol: string;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCryptocurrencyInput {
  symbol: string;
  name: string;
  is_active?: boolean;
}

export type UpdateCryptocurrencyInput = Partial<CreateCryptocurrencyInput>;