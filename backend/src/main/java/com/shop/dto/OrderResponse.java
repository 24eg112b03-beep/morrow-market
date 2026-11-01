package com.shop.dto;

import com.shop.model.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(Long id, Long userId, String customerName, String customerEmail,
        BigDecimal totalAmount, OrderStatus orderStatus, LocalDateTime orderDate,
        List<OrderLineResponse> items) {
}