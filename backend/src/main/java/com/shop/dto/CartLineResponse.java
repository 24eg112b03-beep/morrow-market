package com.shop.dto;

import java.math.BigDecimal;

public record CartLineResponse(Long id, Long productId, String name, String image,
        BigDecimal price, int quantity, int availableQuantity) {
}