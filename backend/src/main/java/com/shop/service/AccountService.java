package com.shop.service;

import com.shop.model.AppUser;
import com.shop.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountService {
    private final UserRepository users;

    public AccountService(UserRepository users) {
        this.users = users;
    }

    public AppUser requireUser(String email) {
        return users.findByEmail(email).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found"));
    }
}