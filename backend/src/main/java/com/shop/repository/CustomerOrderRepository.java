package com.shop.repository;

import com.shop.model.CustomerOrder;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    List<CustomerOrder> findByUser_IdOrderByOrderDateDesc(Long userId);
    List<CustomerOrder> findAllByOrderByOrderDateDesc();
}