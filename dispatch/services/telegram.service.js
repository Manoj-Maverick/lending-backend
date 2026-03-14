import axios from "axios";

function getTelegramApi() {
  const token = "8640213175:AAF6wye_V1v0Dckzt3W5cBVlXsptX25e7Qg";
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }

  return `https://api.telegram.org/bot${token}`;
}

export async function sendTelegramMessage(chatId, message) {
  try {
    const telegramApi = getTelegramApi();

    await axios.post(`${telegramApi}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("Telegram send failed:", err.response?.data || err);
  }
}
