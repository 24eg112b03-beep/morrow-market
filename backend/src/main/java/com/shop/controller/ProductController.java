package com.shop.controller;

import com.shop.dto.ProductRequest;
import com.shop.model.Product;
import com.shop.repository.CartItemRepository;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.ProductRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductRepository products;
    private final CartItemRepository cartItems;
    private final OrderItemRepository orderItems;

    public ProductController(ProductRepository products, CartItemRepository cartItems, OrderItemRepository orderItems) {
        this.products = products;
        this.cartItems = cartItems;
        this.orderItems = orderItems;
    }

    @GetMapping
    public List<Product> list(@RequestParam(required = false, defaultValue = "") String search) {
        if (search.isBlank()) return products.findAll();
        return products.findByNameContainingIgnoreCaseOrderByNameAsc(search.trim());
    }

    @GetMapping("/{id}")
    public Product get(@PathVariable Long id) {
        return findProduct(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public Product create(@Valid @RequestBody ProductRequest request) {
        return products.save(new Product(request.name().trim(), request.description().trim(), request.price(),
                request.quantity(), request.image()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Product update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        Product product = findProduct(id);
        product.update(request.name().trim(), request.description().trim(), request.price(),
                request.quantity(), request.image());
        return products.save(product);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        Product product = findProduct(id);
        if (cartItems.existsByProduct_Id(id) || orderItems.existsByProduct_Id(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This product is in a cart or order history and cannot be deleted");
        }
        products.delete(product);
    }

    private Product findProduct(Long id) {
        return products.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }
}