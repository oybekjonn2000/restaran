package com.restoran.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TelegramBotService {

    @Value("${telegram.bot.token:}")
    private String botToken;

    @Value("${telegram.webapp.url:}")
    private String webAppUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private long lastUpdateId = 0;

    @Scheduled(fixedDelay = 2000) // Poll every 2 seconds
    public void pollTelegramUpdates() {
        if (botToken == null || botToken.isEmpty() || botToken.startsWith("YOUR_") || "8988031463:AAHTgeEO9Bg1p6z3bYfy-GYrYmoJ0zFRCRo".equals(botToken)) {
            // Using a dummy or placeholder token means we skip polling to avoid spamming errors if token isn't active yet
            // (Note: The user token '8988031463:AAHTgeEO9Bg1p6z3bYfy-GYrYmoJ0zFRCRo' is real, so we should allow it!)
        }
        
        // Skip if default placeholder is active
        if (botToken == null || botToken.isEmpty() || botToken.contains("YOUR_TELEGRAM_BOT_TOKEN")) {
            return;
        }

        try {
            String url = "https://api.telegram.org/bot" + botToken + "/getUpdates?offset=" + (lastUpdateId + 1) + "&timeout=1";
            String response = restTemplate.getForObject(url, String.class);
            if (response == null) return;

            JsonNode root = objectMapper.readTree(response);
            JsonNode okNode = root.get("ok");
            if (okNode != null && okNode.asBoolean()) {
                JsonNode result = root.get("result");
                if (result != null && result.isArray()) {
                    for (JsonNode update : result) {
                        long updateId = update.get("update_id").asLong();
                        lastUpdateId = Math.max(lastUpdateId, updateId);

                        JsonNode message = update.get("message");
                        if (message != null) {
                            JsonNode chat = message.get("chat");
                            JsonNode textNode = message.get("text");
                            if (chat != null && textNode != null) {
                                long chatId = chat.get("id").asLong();
                                String text = textNode.asText();

                                if ("/start".equals(text)) {
                                    sendStartMessage(chatId);
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Log update error
            System.err.println("Telegram Bot error polling: " + e.getMessage());
        }
    }

    private void sendStartMessage(long chatId) {
        try {
            String text = "👋 *Assalomu alaykum!*\n\n" +
                          "🍔 *Food Delivery* restoran buyurtma tizimi botiga xush kelibsiz!\n\n" +
                          "Taomlarni tanlash va buyurtma berish uchun quyidagi tugmani yoki pastdagi *🍽️ Menu* tugmasini bosing.";

            String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
            
            Map<String, Object> body = new HashMap<>();
            body.put("chat_id", chatId);
            body.put("text", text);
            body.put("parse_mode", "Markdown");

            if (webAppUrl != null && !webAppUrl.isEmpty() && !webAppUrl.contains("YOUR_")) {
                Map<String, Object> webApp = new HashMap<>();
                webApp.put("url", webAppUrl);

                Map<String, Object> button = new HashMap<>();
                button.put("text", "🍽️ Buyurtma berish");
                button.put("web_app", webApp);

                List<List<Map<String, Object>>> keyboard = List.of(List.of(button));

                Map<String, Object> replyMarkup = new HashMap<>();
                replyMarkup.put("inline_keyboard", keyboard);

                body.put("reply_markup", replyMarkup);
            }

            restTemplate.postForObject(url, body, String.class);
        } catch (Exception e) {
            System.err.println("Telegram Bot error sending message: " + e.getMessage());
        }
    }
}
