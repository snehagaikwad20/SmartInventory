package com.smartinventory.repository;

import com.smartinventory.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // Products expiring between two dates
    List<Product> findByExpiryDateBetween(
            LocalDate startDate,
            LocalDate endDate
    );

    // Products having stock less than given quantity
    List<Product> findByQuantityLessThan(Integer quantity);
}