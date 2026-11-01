package com.shop.dto;

import java.math.BigDecimal;

public record OrderLineResponse(Long productId, String name, String image,
        int quantity, BigDecimal price) {
}