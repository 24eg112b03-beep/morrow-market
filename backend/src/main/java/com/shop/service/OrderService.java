package com.shop.service;

import com.shop.dto.OrderLineResponse;
import com.shop.dto.OrderResponse;
import com.shop.model.AppUser;
import com.shop.model.CartItem;
import com.shop.model.CustomerOrder;
import com.shop.model.OrderItem;
import com.shop.model.OrderStatus;
import com.shop.model.Product;
import com.shop.repository.CartItemRepository;
import com.shop.repository.CustomerOrderRepository;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class OrderService {
    private final CustomerOrderRepository orders;
    private final OrderItemRepository orderItems;
    private final CartItemRepository cartItems;
    private final ProductRepository products;
    private final AccountService accounts;

    public OrderService(CustomerOrderRepository orders, OrderItemRepository orderItems,
            CartItemRepository cartItems, ProductRepository products, AccountService accounts) {
        this.orders = orders;
        this.orderItems = orderItems;
        this.cartItems = cartItems;
        this.products = products;
        this.accounts = accounts;
    }

    public OrderResponse placeOrder(String email) {
        AppUser user = accounts.requireUser(email);
        List<CartItem> lines = cartItems.findByUser_IdOrderByIdAsc(user.getId());
        if (lines.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your cart is empty");
        }

        BigDecimal total = BigDecimal.ZERO;
        for (CartItem line : lines) {
            Product product = products.findByIdForUpdate(line.getProduct().getId()).orElseThrow(
                    () -> new ResponseStatusException(HttpStatus.CONFLICT, "A product is no longer available"));
            if (product.getQuantity() < line.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        product.getName() + " no longer has enough stock");
            }
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(line.getQuantity())));
        }

        CustomerOrder order = orders.save(new CustomerOrder(user, total));
        for (CartItem line : lines) {
            Product product = products.findByIdForUpdate(line.getProduct().getId()).orElseThrow(
                    () -> new ResponseStatusException(HttpStatus.CONFLICT, "A product is no longer available"));
            product.update(product.getName(), product.getDescription(), product.getPrice(),
                    product.getQuantity() - line.getQuantity(), product.getImage());
            orderItems.save(new OrderItem(order, product, line.getQuantity(), product.getPrice()));
        }
        cartItems.deleteByUser_Id(user.getId());
        return toResponse(order, orderItems.findByOrder_IdOrderByIdAsc(order.getId()));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> customerOrders(String email) {
        AppUser user = accounts.requireUser(email);
        return orders.findByUser_IdOrderByOrderDateDesc(user.getId()).stream()
                .map(order -> toResponse(order, orderItems.findByOrder_IdOrderByIdAsc(order.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> allOrders() {
        return orders.findAllByOrderByOrderDateDesc().stream()
                .map(order -> toResponse(order, orderItems.findByOrder_IdOrderByIdAsc(order.getId()))).toList();
    }

    public OrderResponse updateStatus(Long orderId, OrderStatus status) {
        CustomerOrder order = orders.findById(orderId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (order.getOrderStatus() == OrderStatus.CANCELLED && status != OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A cancelled order cannot be reopened");
        }
        if (status == OrderStatus.CANCELLED && order.getOrderStatus() != OrderStatus.CANCELLED) {
            for (OrderItem line : orderItems.findByOrder_IdOrderByIdAsc(orderId)) {
                Product product = products.findByIdForUpdate(line.getProduct().getId()).orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.CONFLICT, "A product is no longer available"));
                product.update(product.getName(), product.getDescription(), product.getPrice(),
                        product.getQuantity() + line.getQuantity(), product.getImage());
            }
        }
        order.setOrderStatus(status);
        return toResponse(orders.save(order), orderItems.findByOrder_IdOrderByIdAsc(orderId));
    }

    private OrderResponse toResponse(CustomerOrder order, List<OrderItem> lines) {
        List<OrderLineResponse> items = lines.stream().map(line -> new OrderLineResponse(
                line.getProduct().getId(), line.getProduct().getName(), line.getProduct().getImage(),
                line.getQuantity(), line.getPrice())).toList();
        return new OrderResponse(order.getId(), order.getUser().getId(), order.getUser().getName(),
                order.getUser().getEmail(), order.getTotalAmount(), order.getOrderStatus(),
                order.getOrderDate(), items);
    }
}