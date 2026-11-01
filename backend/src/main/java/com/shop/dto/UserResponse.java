package com.shop.dto;

import com.shop.model.Role;

public record UserResponse(Long id, String name, String email, Role role) {
}