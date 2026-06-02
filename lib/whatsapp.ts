interface WhatsAppMessage {
  phone: string;
  message: string;
  shopToken: string;
  phoneNumberId: string;
}

export async function sendWhatsAppMessage({ phone, message, shopToken, phoneNumberId }: WhatsAppMessage) {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'text',
    text: { body: message },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${shopToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp API error: ${err}`);
  }

  return res.json();
}

export function buildReminderMessage(params: {
  customerName: string;
  shopName: string;
  outstandingBalance: number;
  dueDate: string;
  monthlyInterest: number;
  loanId: string;
}) {
  return `🏅 *Gold Loan Reminder*

Hello ${params.customerName},

This is a reminder from *${params.shopName}* regarding your gold loan.

📋 *Loan ID:* ${params.loanId.slice(-6).toUpperCase()}
💰 *Outstanding Balance:* ₹${params.outstandingBalance.toLocaleString('en-IN')}
📅 *Due Date:* ${params.dueDate}
📈 *Monthly Interest:* ₹${params.monthlyInterest.toLocaleString('en-IN')}

Please visit the shop or contact us to make your payment and avoid additional interest charges.

Thank you for your trust! 🙏`;
}

export function buildPaymentConfirmMessage(params: {
  customerName: string;
  shopName: string;
  amountPaid: number;
  outstandingBalance: number;
  date: string;
}) {
  return `✅ *Payment Received*

Hello ${params.customerName},

We have received your payment at *${params.shopName}*.

💵 *Amount Paid:* ₹${params.amountPaid.toLocaleString('en-IN')}
📅 *Date:* ${params.date}
📊 *Remaining Balance:* ₹${params.outstandingBalance.toLocaleString('en-IN')}

Thank you for your payment! 🙏`;
}
