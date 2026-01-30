export interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Budget {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_document: string;
  client_address: string;
  company_name: string;
  company_document: string;
  company_address: string;
  company_phone: string;
  company_logo: string;
  items: BudgetItem[];
  total_amount: number;
  notes: string;
  delivery_time: string;
  payment_terms: string;
  valid_until: string;
  created_at: string;
  user_id: string;
}

export interface NewBudget {
  client_name: string;
  client_email: string;
  client_phone: string;
  client_document: string;
  client_address: string;
  company_name: string;
  company_document: string;
  company_address: string;
  company_phone: string;
  company_logo: string;
  items: BudgetItem[];
  total_amount: number;
  notes: string;
  delivery_time: string;
  payment_terms: string;
  valid_until: string;
  user_id: string;
}

export type BudgetStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'expired';

export const EMPTY_BUDGET: Omit<NewBudget, 'user_id'> = {
  client_name: "",
  client_email: "",
  client_phone: "",
  client_document: "",
  client_address: "",
  company_name: "",
  company_document: "",
  company_address: "",
  company_phone: "",
  company_logo: "",
  items: [],
  total_amount: 0,
  notes: "",
  delivery_time: "",
  payment_terms: "",
  valid_until: ""
};
