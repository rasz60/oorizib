import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";
import { OPEN_BANKING_BASE_URL } from "@/constants";

const CLIENT_ID = process.env.OPEN_BANKING_CLIENT_ID!;
const CLIENT_SECRET = process.env.OPEN_BANKING_CLIENT_SECRET!;
const REDIRECT_URI = process.env.OPEN_BANKING_REDIRECT_URI ?? "oorizib://openbanking/callback";

export async function startOAuthFlow(): Promise<void> {
  const state = Math.random().toString(36).substring(2);
  await SecureStore.setItemAsync("ob_state", state);

  const url =
    `${OPEN_BANKING_BASE_URL}/oauth/2.0/authorize` +
    `?response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=login inquiry transfer` +
    `&state=${state}` +
    `&auth_type=0`;

  await Linking.openURL(url);
}

export async function exchangeCodeForToken(
  code: string,
  state: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const savedState = await SecureStore.getItemAsync("ob_state");
  if (savedState !== state) throw new Error("OAuth state 불일치");

  const res = await fetch(`${OPEN_BANKING_BASE_URL}/oauth/2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }).toString(),
  });
  const data = await res.json();
  if (data.rsp_code !== "A0000") throw new Error(data.rsp_message);
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<string> {
  const res = await fetch(`${OPEN_BANKING_BASE_URL}/oauth/2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });
  const data = await res.json();
  return data.access_token;
}

export interface BankAccount {
  fintechUseNum: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
}

export async function fetchLinkedAccounts(
  accessToken: string,
  userSeqNo: string
): Promise<BankAccount[]> {
  const res = await fetch(
    `${OPEN_BANKING_BASE_URL}/v2.0/account/list?user_seq_no=${userSeqNo}&include_cancel_yn=N&sort_order=D`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await res.json();
  return (data.res_list ?? []).map((a: any) => ({
    fintechUseNum: a.fintech_use_num,
    bankName: a.bank_name,
    bankCode: a.bank_code_std,
    accountNumber: a.account_num_masked,
    accountHolderName: a.account_holder_name,
  }));
}

export interface Transaction {
  tranDate: string;
  tranTime: string;
  inoutType: "입금" | "출금";
  tranAmt: number;
  afterBalanceAmt: number;
  printContent: string;
  tranNo: string;
}

export async function fetchTransactionHistory(
  accessToken: string,
  fintechUseNum: string,
  fromDate: string,
  toDate: string
): Promise<Transaction[]> {
  const res = await fetch(
    `${OPEN_BANKING_BASE_URL}/v2.0/account/transaction_list/fin_num` +
      `?fintech_use_num=${fintechUseNum}` +
      `&inquiry_type=A` +
      `&inquiry_base=D` +
      `&from_date=${fromDate}` +
      `&to_date=${toDate}` +
      `&sort_order=D` +
      `&tran_dtime=${new Date().toISOString().replace(/[-:T.Z]/g, "").substring(0, 14)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await res.json();
  return (data.res_list ?? []).map((t: any) => ({
    tranDate: t.tran_date,
    tranTime: t.tran_time,
    inoutType: t.inout_type === "1" ? "입금" : "출금",
    tranAmt: parseInt(t.tran_amt),
    afterBalanceAmt: parseInt(t.after_balance_amt),
    printContent: t.print_content,
    tranNo: t.tran_no,
  }));
}
