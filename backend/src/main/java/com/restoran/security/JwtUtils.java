package com.restoran.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    private final SecretKey jwtSecretKey = Keys.hmacShaKeyFor(generateRandomSecretBytes());

    private static byte[] generateRandomSecretBytes() {
        byte[] bytes = new byte[64];
        new java.security.SecureRandom().nextBytes(bytes);
        return bytes;
    }

    public String generateToken(String email, boolean rememberMe) {
        long expirationMs = rememberMe ? (7L * 24 * 60 * 60 * 1000) : (1L * 60 * 60 * 1000); // 7 days vs 1 hour
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key())
                .compact();
    }

    public String generateToken(String email) {
        return generateToken(email, false);
    }

    private SecretKey key() {
        return jwtSecretKey;
    }

    public String getEmailFromToken(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key()).build().parse(token);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("JWT token noto'g'ri: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token muddati tugagan: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token qo'llab quvvatlanmaydi: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT token bo'sh: {}", e.getMessage());
        }
        return false;
    }
}
