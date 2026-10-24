// The organisers' public contact details, in one place (contact page, footer,
// tournament pages). ORGANISERS_EMAIL (env) is separate: it's where the
// contact form and alerts are delivered.
export const WHATSAPP_NUMBER = "919500119200";
export const WHATSAPP_DISPLAY = "+91 95001 19200";
export const CONTACT_EMAIL = "nagaratharschesschampionship@gmail.com";

/** A wa.me chat link to the organisers with the message prefilled. */
export function whatsappLink(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export const WHATSAPP_GREETING = "Hi, I have a question about Nagarathar's Chess Championship.";

/** Longest message carried into the WhatsApp text (wa.me links get unwieldy past this). */
export const WHATSAPP_MESSAGE_MAX = 700;

/** The contact form's message as a WhatsApp text: "Hi, I'm {name} ({email}). {message}". */
export function contactWhatsappText({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) {
  let body = message.trim();
  if (body.length > WHATSAPP_MESSAGE_MAX) {
    body = `${body.slice(0, WHATSAPP_MESSAGE_MAX - 1).trimEnd()}…`;
  }
  return `Hi, I'm ${name.trim()} (${email.trim()}). ${body}`;
}
