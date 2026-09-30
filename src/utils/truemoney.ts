export interface TrueMoneyRedeemResult {
  success: boolean;
  amount?: number;
  message: string;
  code?: string;
  ownerName?: string;
  voucherHash?: string;
}

/**
 * Extracts TrueMoney Angpao voucher hash from full URL or raw string.
 * Formats supported:
 * - https://gift.truemoney.com/v2/verify/?v=xxxxxxxxxxxxxxx
 * - https://gift.truemoney.com/v2/giftcards/xxxxxxxxxxxxxxx/redeem
 * - v=xxxxxxxxxxxxxxx
 * - xxxxxxxxxxxxxxx (raw 10-45 char alphanumeric string)
 */
export function extractVoucherHash(urlOrCode: string): string | null {
  if (!urlOrCode) return null;
  const trimmed = urlOrCode.trim();

  // Pattern 1: ?v=XXXXXXXXXXXXXXX
  const matchV = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (matchV && matchV[1]) return matchV[1];

  // Pattern 2: /giftcards/XXXXXXXXXXXXXXX/redeem or /v2/giftcards/XXXXXXXXXXXXXXX
  const matchPath = trimmed.match(/giftcards\/([a-zA-Z0-9_-]+)/);
  if (matchPath && matchPath[1]) return matchPath[1];

  // Pattern 3: raw hash code
  if (/^[a-zA-Z0-9_-]{10,45}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Calls TrueMoney API to redeem an Angpao gift voucher.
 * Automatically tries direct request, followed by fallback CORS proxies for web client environments.
 */
export async function redeemTrueMoneyVoucher(
  voucherUrlOrCode: string,
  mobilePhone: string
): Promise<TrueMoneyRedeemResult> {
  const voucherHash = extractVoucherHash(voucherUrlOrCode);
  if (!voucherHash) {
    return {
      success: false,
      message: 'ลิงก์ซองทรูมันนี่ไม่ถูกต้อง กรุณาตรวจสอบลิงก์อีกครั้ง',
    };
  }

  const cleanPhone = mobilePhone.replace(/[^0-9]/g, '');
  if (!/^0[689]\d{8}$/.test(cleanPhone)) {
    return {
      success: false,
      message: 'เบอร์โทรศัพท์ทรูมันนี่ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 06, 08, 09 และมี 10 หลัก)',
    };
  }

  const targetUrl = `https://gift.truemoney.com/v2/giftcards/${voucherHash}/redeem`;
  const payload = JSON.stringify({
    mobile: cleanPhone,
    voucher_hash: voucherHash,
  });

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: payload,
  };

  // Modern CORS proxies list for client-side web apps
  const proxies = [
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  ];

  const attempts: (() => Promise<Response>)[] = [
    () => fetch(targetUrl, requestOptions),
    ...proxies.map(p => () => fetch(p(targetUrl), requestOptions)),
  ];

  let lastErrorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ TrueMoney (การเชื่อมต่อถูกบล็อก หรือ ลิงก์ซองหมดอายุ)';

  for (const attempt of attempts) {
    try {
      const response = await attempt();
      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (e) {
        continue;
      }

      if (data && data.status) {
        if (data.status.code === 'SUCCESS') {
          const amountStr =
            data.data?.my_ticket?.amount_baht ||
            data.data?.voucher?.amount_baht ||
            '0';
          const amount = parseFloat(amountStr);
          const ownerName = data.data?.owner_profile?.full_name || 'ผู้สร้างซอง';

          return {
            success: true,
            amount,
            ownerName,
            voucherHash,
            message: `รับซองทรูมันนี่สำเร็จ! ได้รับเงิน ฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`,
          };
        } else {
          const code = data.status.code;
          let message = 'ไม่สามารถรับซองทรูมันนี่ได้';

          switch (code) {
            case 'VOUCHER_OUT_OF_STOCK':
              message = 'ซองอั่งเปานี้ถูกใช้งานไปหมดแล้ว หรือมีคนรับไปแล้ว';
              break;
            case 'VOUCHER_NOT_FOUND':
              message = 'ไม่พบรหัสซองอั่งเปานี้ในระบบ TrueMoney (กรุณาตรวจสอบลิงก์อีกครั้ง)';
              break;
            case 'VOUCHER_EXPIRED':
              message = 'ซองอั่งเปานี้หมดอายุแล้ว';
              break;
            case 'TARGET_USER_NOT_FOUND':
              message = 'เบอร์รับเงินที่ตั้งไว้ในแอดมินยังไม่ได้ลงทะเบียน TrueMoney Wallet';
              break;
            case 'CANNOT_GET_OWN_VOUCHER':
              message = 'เบอร์คนสร้างซองกับเบอร์รับเงินเป็นเบอร์เดียวกัน (ไม่สามารถรับซองของตัวเองได้)';
              break;
            default:
              if (data.status?.message) {
                message = `[TrueMoney] ${data.status.message}`;
              } else if (code) {
                message = `[TrueMoney] รหัสข้อผิดพลาด: ${code}`;
              }
          }

          return {
            success: false,
            code,
            voucherHash,
            message,
          };
        }
      }
    } catch (err: any) {
      console.warn('TrueMoney redeem attempt failed:', err);
    }
  }

  return {
    success: false,
    message: lastErrorMessage,
  };
}
