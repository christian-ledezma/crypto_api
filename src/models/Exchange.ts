import { User } from './User';
import { Cryptocurrency } from './Cryptocurrency';

export type ExchangeStatus = 'pending' | 'completed' | 'failed';

export interface Exchange {
  id: number;
  from_user_id: number;
  to_user_id: number;
  from_currency_id: number;
  to_currency_id: number;
  from_amount: number;
  to_amount: number;
  exchange_api_rate: number;
  status: ExchangeStatus;
  created_at: Date;
  updated_at: Date;
}

export interface ExchangeWithDetails extends Exchange {
  from_user: User;
  to_user: User;
  from_currency: Cryptocurrency;
  to_currency: Cryptocurrency;
}

export interface CreateExchangeInput {
  from_user_id: number;
  to_user_id: number;
  from_currency_id: number;
  to_currency_id: number;
  from_amount: number;
  to_amount: number;
  exchange_api_rate: number;
}

export interface UpdateExchangeStatus {
  status: ExchangeStatus;
}