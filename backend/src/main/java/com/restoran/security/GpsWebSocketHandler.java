package com.restoran.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.restoran.entity.Order;
import com.restoran.security.JwtUtils;
import com.restoran.security.UserDetailsImpl;
import com.restoran.security.UserDetailsServiceImpl;
import com.restoran.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
@RequiredArgsConstructor
public class GpsWebSocketHandler extends TextWebSocketHandler {

    private final JwtUtils jwtUtils;
    private final UserDetailsServiceImpl userDetailsService;
    private final OrderService orderService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // orderId -> List of sessions
    private static final Map<Long, List<WebSocketSession>> orderSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();
        if (uri == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        String query = uri.getQuery();
        String token = getQueryParam(query, "token");
        String orderIdStr = getQueryParam(query, "orderId");

        if (token == null || orderIdStr == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        if (!jwtUtils.validateToken(token)) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        String email = jwtUtils.getEmailFromToken(token);
        UserDetailsImpl userDetails = (UserDetailsImpl) userDetailsService.loadUserByUsername(email);
        if (userDetails == null) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        Long orderId = Long.parseLong(orderIdStr);
        session.getAttributes().put("userId", userDetails.getId());
        session.getAttributes().put("role", userDetails.getAuthorities().iterator().next().getAuthority());
        session.getAttributes().put("orderId", orderId);

        orderSessions.computeIfAbsent(orderId, k -> new CopyOnWriteArrayList<>()).add(session);
        System.out.println(">>> WebSocket connected. User: " + email + ", Order: " + orderId);
        
        // Try to fetch current order state and send immediately on connection
        try {
            Order order = orderService.getAllOrders().stream()
                    .filter(o -> o.getId().equals(orderId))
                    .findFirst()
                    .orElse(null);
            if (order != null) {
                sendSingleOrderUpdate(session, order);
            }
        } catch (Exception e) {
            System.err.println("Could not send initial order state on connection: " + e.getMessage());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Long orderId = (Long) session.getAttributes().get("orderId");
        String role = (String) session.getAttributes().get("role");

        if (orderId == null || role == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        // Only couriers are allowed to upload their coordinates
        if (!"ROLE_COURIER".equals(role)) {
            return; 
        }

        try {
            Map<String, Object> data = objectMapper.readValue(message.getPayload(), Map.class);
            Double latitude = data.get("latitude") != null ? ((Number) data.get("latitude")).doubleValue() : null;
            Double longitude = data.get("longitude") != null ? ((Number) data.get("longitude")).doubleValue() : null;
            Boolean gpsSignalLost = data.get("gpsSignalLost") != null ? (Boolean) data.get("gpsSignalLost") : false;

            Order order = orderService.updateCourierLocation(orderId, latitude, longitude, gpsSignalLost);

            // Broadcast the updated coordinates and statistics to all sessions subscribed to this orderId
            broadcastOrderUpdate(orderId, order);
        } catch (Exception e) {
            System.err.println("Error processing GPS update via WS: " + e.getMessage());
            Map<String, String> errMap = new HashMap<>();
            errMap.put("error", e.getMessage());
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(errMap)));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long orderId = (Long) session.getAttributes().get("orderId");
        if (orderId != null && orderSessions.containsKey(orderId)) {
            orderSessions.get(orderId).remove(session);
            if (orderSessions.get(orderId).isEmpty()) {
                orderSessions.remove(orderId);
            }
        }
        System.out.println(">>> WebSocket closed for session: " + session.getId());
    }

    private void sendSingleOrderUpdate(WebSocketSession session, Order order) throws IOException {
        Map<String, Object> update = serializeOrderTracking(order);
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(update)));
    }

    private void broadcastOrderUpdate(Long orderId, Order order) {
        List<WebSocketSession> sessions = orderSessions.get(orderId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        Map<String, Object> update = serializeOrderTracking(order);

        try {
            String payload = objectMapper.writeValueAsString(update);
            TextMessage textMessage = new TextMessage(payload);
            for (WebSocketSession s : sessions) {
                if (s.isOpen()) {
                    s.sendMessage(textMessage);
                }
            }
        } catch (IOException e) {
            System.err.println("Error broadcasting order update: " + e.getMessage());
        }
    }

    private Map<String, Object> serializeOrderTracking(Order order) {
        Map<String, Object> update = new HashMap<>();
        update.put("orderId", order.getId());
        update.put("status", order.getStatus().toString());
        update.put("courierLatitude", order.getCourierLatitude());
        update.put("courierLongitude", order.getCourierLongitude());
        update.put("courierStartLatitude", order.getCourierStartLatitude());
        update.put("courierStartLongitude", order.getCourierStartLongitude());
        update.put("restaurantLatitude", order.getRestaurantLatitude());
        update.put("restaurantLongitude", order.getRestaurantLongitude());
        update.put("distanceToRestaurant", order.getDistanceToRestaurant());
        update.put("etaToRestaurant", order.getEtaToRestaurant() != null ? order.getEtaToRestaurant().toString() : null);
        update.put("courierAcceptedAt", order.getCourierAcceptedAt() != null ? order.getCourierAcceptedAt().toString() : null);
        update.put("courierArrivedAtRestaurantAt", order.getCourierArrivedAtRestaurantAt() != null ? order.getCourierArrivedAtRestaurantAt().toString() : null);
        update.put("gpsSignalLost", order.getGpsSignalLost());
        return update;
    }

    private String getQueryParam(String query, String name) {
        if (query == null || name == null) return null;
        for (String param : query.split("&")) {
            String[] entry = param.split("=");
            if (entry.length > 1 && name.equals(entry[0])) {
                return entry[1];
            }
        }
        return null;
    }
}
