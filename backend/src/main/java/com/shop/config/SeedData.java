package com.shop.config;

import com.shop.model.AppUser;
import com.shop.model.Product;
import com.shop.model.Role;
import com.shop.repository.ProductRepository;
import com.shop.repository.UserRepository;
import java.math.BigDecimal;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SeedData {
    @Bean
    CommandLineRunner seed(UserRepository users, ProductRepository products, PasswordEncoder encoder) {
        return args -> {
            if (!users.existsByEmail("admin@example.com")) {
                users.save(new AppUser("Shop Admin", "admin@example.com", encoder.encode("admin1234"), Role.ADMIN));
            }
            if (products.count() == 0) {
                products.save(new Product("Everyday Canvas Tote", "A sturdy cotton canvas tote for daily errands and market runs.", new BigDecimal("24.00"), 24, "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85"));
                products.save(new Product("Ceramic Pour-over Set", "A handmade ceramic dripper and matching cup for a slower morning.", new BigDecimal("48.00"), 12, "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85"));
                products.save(new Product("Desk Plant + Pot", "A low-maintenance green companion in a matte stoneware planter.", new BigDecimal("32.50"), 18, "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=85"));
                products.save(new Product("Linen Utility Apron", "Soft washed linen with two roomy front pockets.", new BigDecimal("56.00"), 9, "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=85"));
            }
        };
    }
}