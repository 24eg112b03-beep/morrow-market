package com.shop.service;

import com.shop.dto.CartLineResponse;
import com.shop.dto.CartRequest;
import com.shop.model.AppUser;
import com.shop.model.CartItem;
import com.shop.model.Product;
import com.shop.repository.CartItemRepository;
import com.shop.repository.ProductRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class CartService {
    private final CartItemRepository cartItems;
    private final ProductRepository products;
    private final AccountService accounts;

    public CartService(CartItemRepository cartItems, ProductRepository products, AccountService accounts) {
        this.cartItems = cartItems;
        this.products = products;
        this.accounts = accounts;
    }

    @Transactional(readOnly = true)
    public List<CartLineResponse> getCart(String email) {
        AppUser user = accounts.requireUser(email);
        return cartItems.findByUser_IdOrderByIdAsc(user.getId()).stream().map(this::toResponse).toList();
    }

    public CartLineResponse add(String email, CartRequest request) {
        AppUser user = accounts.requireUser(email);
        Product product = products.findById(request.productId()).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        CartItem existing = cartItems.findByUser_IdAndProduct_Id(user.getId(), product.getId()).orElse(null);
        int nextQuantity = request.quantity() + (existing == null ? 0 : existing.getQuantity());
        if (product.getQuantity() < nextQuantity) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Not enough stock available");
        }
        if (existing == null) {
            existing = new CartItem(user, product, request.quantity());
        } else {
            existing.setQuantity(nextQuantity);
        }
        return toResponse(cartItems.save(existing));
    }

    public void remove(String email, Long itemId) {
        AppUser user = accounts.requireUser(email);
        CartItem item = cartItems.findById(itemId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));
        if (!item.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found");
        }
        cartItems.delete(item);
    }

    private CartLineResponse toResponse(CartItem item) {
        Product product = item.getProduct();
        return new CartLineResponse(item.getId(), product.getId(), product.getName(), product.getImage(),
                product.getPrice(), item.getQuantity(), product.getQuantity());
    }
}