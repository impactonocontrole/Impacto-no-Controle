type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
};

function normalizeEmailList(values: Array<string | null | undefined>) {
  return values
    .flatMap((value) => String(value || "").split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function fromLooksLikePersonalEmail(from: string) {
  return /@(gmail|googlemail|hotmail|outlook|yahoo)\./i.test(from);
}

export async function sendEmail({ to, subject, html, text, cc = [] }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.IMPACTO_ADMIN_EMAIL || "impactonocontrole@gmail.com";
  const configuredFrom = process.env.EMAIL_FROM || "Impacto no Controle <onboarding@resend.dev>";
  const from = fromLooksLikePersonalEmail(configuredFrom)
    ? "Impacto no Controle <onboarding@resend.dev>"
    : configuredFrom;

  if (!apiKey) {
    console.warn("RESEND_API_KEY não configurada. E-mail não enviado.");
    return { skipped: true, reason: "missing_api_key" };
  }

  const payload = {
    from,
    to: normalizeEmailList([to]),
    cc: normalizeEmailList(cc),
    reply_to: adminEmail,
    subject,
    html,
    text,
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Falha ao enviar e-mail pelo Resend", { status: response.status, body });
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
