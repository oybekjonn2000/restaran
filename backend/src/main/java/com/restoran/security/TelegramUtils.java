package com.restoran.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.restoran.dto.request.TelegramUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Component
public class TelegramUtils {

    @Value("${telegram.bot.token:}")
    private String botToken;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean verifyInitData(String initData) {
        if (botToken == null || botToken.isEmpty()) {
            System.err.println("Telegram bot token is not configured in application.properties!");
            return false;
        }
        try {
            if (initData == null || initData.isEmpty()) {
                return false;
            }

            Map<String, String> params = parseQueryParams(initData);
            String hash = params.get("hash");
            if (hash == null) {
                return false;
            }

            params.remove("hash");

            List<String> sortedKeys = new ArrayList<>(params.keySet());
            Collections.sort(sortedKeys);

            StringBuilder dataCheckSb = new StringBuilder();
            for (int i = 0; i < sortedKeys.size(); i++) {
                String key = sortedKeys.get(i);
                dataCheckSb.append(key).append("=").append(params.get(key));
                if (i < sortedKeys.size() - 1) {
                    dataCheckSb.append("\n");
                }
            }
            String dataCheckString = dataCheckSb.toString();

            // Secret key: HMAC-SHA256 with key "WebApps" and value botToken
            byte[] secretKey = hmacSha256("WebApps".getBytes(StandardCharsets.UTF_8), botToken.getBytes(StandardCharsets.UTF_8));
            byte[] calculatedHashBytes = hmacSha256(secretKey, dataCheckString.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : calculatedHashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            return hexString.toString().equals(hash);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public TelegramUser parseUser(String initData) {
        try {
            Map<String, String> params = parseQueryParams(initData);
            String userJson = params.get("user");
            if (userJson == null) {
                return null;
            }
            return objectMapper.readValue(userJson, TelegramUser.class);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private Map<String, String> parseQueryParams(String queryStr) {
        Map<String, String> params = new HashMap<>();
        String[] pairs = queryStr.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            if (idx != -1) {
                String key = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
                String value = URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
                params.put(key, value);
            }
        }
        return params;
    }

    private byte[] hmacSha256(byte[] key, byte[] data) throws NoSuchAlgorithmException, InvalidKeyException {
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secret_key = new SecretKeySpec(key, "HmacSHA256");
        sha256_HMAC.init(secret_key);
        return sha256_HMAC.doFinal(data);
    }
}
