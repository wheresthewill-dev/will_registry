export interface UserAddress {
  id: string;
  type: string | null;
  address_line: string | null;
  country: string | null;
  post_code: string | null;
  state: string | null;
  town: string | null;
  user_id: number | null;
}