import * as SecureStore from "expo-secure-store";
import { KIS_BASE_URL } from "@/constants";

const IS_MOCK = false;
const BASE_URL = IS_MOCK ? KIS_BASE_URL.mock : KIS_BASE_URL.real;
const APP_KEY = process.env.KIS_APP_KEY!;
const APP_SECRET = process.env.KIS_APP_SECRET!;

const TOKEN_KEY = "kis_access_token";
const TOKEN_EXPIRY_KEY = "kis_token_expiry";

async function getAccessToken(): Promise<string> {
  const cached = await SecureStore.getItemAsync(TOKEN_KEY);
  const expiry = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
  if (cached && expiry && Date.now() < parseInt(expiry)) return cached;

  const res = await fetch(`${BASE_URL}/oauth2/tokenP`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: APP_KEY,
      appsecret: APP_SECRET,
    }),
  });
  const data = await res.json();
  const token: string = data.access_token;
  const expiryMs = Date.now() + (data.expires_in - 60) * 1000;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiryMs.toString());
  return token;
}

export interface StockPrice {
  currentPrice: number;
  changeRate: number;
  changeAmount: number;
  volume: number;
}

export async function fetchStockPrice(
  symbol: string,
  market: "KR" | "US"
): Promise<StockPrice> {
  const token = await getAccessToken();

  if (market === "KR") {
    const res = await fetch(
      `${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          appkey: APP_KEY,
          appsecret: APP_SECRET,
          tr_id: "FHKST01010100",
        },
      }
    );
    const data = await res.json();
    const o = data.output;
    return {
      currentPrice: parseFloat(o.stck_prpr),
      changeRate: parseFloat(o.prdy_ctrt),
      changeAmount: parseFloat(o.prdy_vrss),
      volume: parseInt(o.acml_vol),
    };
  } else {
    const res = await fetch(
      `${BASE_URL}/uapi/overseas-price/v1/quotations/price?AUTH=&EXCD=NAS&SYMB=${symbol}`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          appkey: APP_KEY,
          appsecret: APP_SECRET,
          tr_id: "HHDFS00000300",
        },
      }
    );
    const data = await res.json();
    const o = data.output;
    return {
      currentPrice: parseFloat(o.last),
      changeRate: parseFloat(o.rate),
      changeAmount: parseFloat(o.diff),
      volume: parseInt(o.tvol),
    };
  }
}

export interface TopStock {
  symbol: string;
  name: string;
  currentPrice: number;
  changeRate: number;
}

export async function fetchTopStocks(
  market: "KR" | "US",
  type: "rise" | "fall"
): Promise<TopStock[]> {
  const token = await getAccessToken();

  if (market === "KR") {
    const fid = type === "rise" ? "0" : "1";
    const res = await fetch(
      `${BASE_URL}/uapi/domestic-stock/v1/ranking/fluctuation?fid_cond_mrkt_div_code=J&fid_cond_scr_div_code=20170&fid_input_iscd=0001&fid_rank_sort_cls_code=${fid}&fid_input_cnt_1=5&fid_prc_cls_code=1&fid_input_price_1=&fid_input_price_2=&fid_vol_cnt=&fid_trgt_cls_code=0&fid_trgt_exls_cls_code=0&fid_div_cls_code=0&fid_rsfl_rate1=&fid_rsfl_rate2=`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          appkey: APP_KEY,
          appsecret: APP_SECRET,
          tr_id: "FHPST01700000",
        },
      }
    );
    const data = await res.json();
    return (data.output ?? []).slice(0, 5).map((o: any) => ({
      symbol: o.stck_shrn_iscd,
      name: o.hts_kor_isnm,
      currentPrice: parseFloat(o.stck_prpr),
      changeRate: parseFloat(o.prdy_ctrt),
    }));
  }

  return [];
}

export async function searchStock(
  keyword: string,
  market: "KR" | "US"
): Promise<{ symbol: string; name: string }[]> {
  const token = await getAccessToken();

  if (market === "KR") {
    const res = await fetch(
      `${BASE_URL}/uapi/domestic-stock/v1/quotations/search-stock-info?PRDT_TYPE_CD=300&MKET_ID_CD=STK&SCRS_ITMS_YN=Y&PDNO=${encodeURIComponent(keyword)}`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          appkey: APP_KEY,
          appsecret: APP_SECRET,
          tr_id: "CTPF1604R",
        },
      }
    );
    const data = await res.json();
    return (data.output ?? []).slice(0, 10).map((o: any) => ({
      symbol: o.shtn_pdno,
      name: o.prdt_name,
    }));
  }

  return [];
}
