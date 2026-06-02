type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
};

export async function sendEmail({ to, subject, html, text, cc = [] }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Impacto no Controle <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("RESEND_API_KEY não configurada. E-mail não enviado.");
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      cc,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao enviar e-mail: ${body}`);
  }

  return response.json();
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
