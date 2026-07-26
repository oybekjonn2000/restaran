package com.restoran.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TelegramBotService {

    private static final Logger logger = LoggerFactory.getLogger(TelegramBotService.class);

    @Value("${telegram.bot.token:}")
    private String botToken;

    @Value("${telegram.webapp.url:}")
    private String webAppUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private long lastUpdateId = 0;

    // Telefon raqami va Chat ID larni xotirada saqlash uchun kesh
    private final Map<String, Long> phoneToChatIdMap = new ConcurrentHashMap<>();

    public Long getChatIdByPhone(String phone) {
        if (phone == null) return null;
        String cleaned = phone.replaceAll("[^0-9+]", "");
        return phoneToChatIdMap.get(cleaned);
    }

    @Scheduled(fixedDelay = 2000) // Poll every 2 seconds
    public void pollTelegramUpdates() {
        if (botToken == null || botToken.isEmpty() || botToken.contains("8988031463:AAHTgeEO9Bg1p6z3bYfy-GYrYmoJ0zFRCRo")) {
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
                            if (chat != null) {
                                long chatId = chat.get("id").asLong();

                                // Contact share qilinganda telefon raqamini saqlash
                                JsonNode contact = message.get("contact");
                                if (contact != null && contact.get("phone_number") != null) {
                                    String rawPhone = contact.get("phone_number").asText();
                                    String cleanPhone = rawPhone.startsWith("+") ? rawPhone : "+" + rawPhone;
                                    phoneToChatIdMap.put(cleanPhone, chatId);
                                    logger.info("Saved phone mapping: {} -> {}", cleanPhone, chatId);
                                }

                                JsonNode textNode = message.get("text");
                                if (textNode != null) {
                                    String text = textNode.asText();
                                    if ("/start".equals(text)) {
                                        sendStartMessage(chatId);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Log update error
        }
    }

    private void sendStartMessage(long chatId) {
        try {
            String text = "👋 *Assalomu alaykum!*\n\n" +
                          "🍔 *Mango Food* restoran buyurtma tizimi botiga xush kelibsiz!\n\n" +
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
            logger.error("Telegram Bot error sending start message: {}", e.getMessage());
        }
    }

    public void sendMessage(long chatId, String text) {
        if (botToken == null || botToken.isEmpty() || botToken.contains("YOUR_TELEGRAM_BOT_TOKEN")) {
            return;
        }
        try {
            String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
            Map<String, Object> body = new HashMap<>();
            body.put("chat_id", chatId);
            body.put("text", text);
            body.put("parse_mode", "Markdown");

            if (webAppUrl != null && !webAppUrl.isEmpty() && !webAppUrl.contains("YOUR_")) {
                Map<String, Object> webApp = new HashMap<>();
                webApp.put("url", webAppUrl);

                Map<String, Object> button = new HashMap<>();
                button.put("text", "🍽️ Ilovani ochish");
                button.put("web_app", webApp);

                body.put("reply_markup", Map.of("inline_keyboard", List.of(List.of(button))));
            }

            restTemplate.postForObject(url, body, String.class);
        } catch (Exception e) {
            logger.error("Telegram Bot error sending message: {}", e.getMessage());
        }
    }
}
