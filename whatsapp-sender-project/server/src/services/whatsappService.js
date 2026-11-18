import axios from "axios";

export async function sendApprovedTemplate({ to, templateName, languageCode = "en_US", components = [] }) {
  const { WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_API_VERSION = "v25.0" } = process.env;
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) throw new Error("WhatsApp Cloud API credentials are not configured");
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const response = await axios.post(url, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: { name: templateName, language: { code: languageCode }, ...(components.length ? { components } : {}) }
  }, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" }, timeout: 20000 });
  const messageId = response.data?.messages?.[0]?.id;
  if (!messageId) throw new Error("WhatsApp Cloud API did not return a message ID");
  return messageId;
}
