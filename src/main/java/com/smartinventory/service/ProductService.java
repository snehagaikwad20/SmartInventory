package com.smartinventory.service;

import com.smartinventory.entity.Product;
import com.smartinventory.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // =========================================================
    // 1. GET ALL PRODUCTS
    // =========================================================
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // =========================================================
    // 2. GET PRODUCT BY ID
    // =========================================================
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    // =========================================================
    // 3. ADD PRODUCT
    // =========================================================
    public Product addProduct(Product product) {
        return productRepository.save(product);
    }

    // =========================================================
    // 4. UPDATE PRODUCT
    // =========================================================
    public Product updateProduct(Long id, Product product) {

        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        existingProduct.setName(product.getName());
        existingProduct.setCategory(product.getCategory());
        existingProduct.setQuantity(product.getQuantity());
        existingProduct.setPrice(product.getPrice());
        existingProduct.setExpiryDate(product.getExpiryDate());
        existingProduct.setDiscount(product.getDiscount());

        return productRepository.save(existingProduct);
    }

    // =========================================================
    // 5. DELETE PRODUCT
    // =========================================================
    public void deleteProduct(Long id) {

        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found");
        }

        productRepository.deleteById(id);
    }

    // =========================================================
    // 6. GET PRODUCTS NEAR EXPIRY
    // Products expiring within next 7 days
    // =========================================================
    public List<Product> getNearExpiryProducts() {

        LocalDate today = LocalDate.now();
        LocalDate next7Days = today.plusDays(7);

        return productRepository.findByExpiryDateBetween(
                today,
                next7Days
        );
    }

    // =========================================================
    // 7. GET LOW STOCK PRODUCTS
    // Quantity less than 10
    // =========================================================
    public List<Product> getLowStockProducts() {

        return productRepository.findByQuantityLessThan(10);
    }

    // =========================================================
    // 8. CALCULATE DYNAMIC DISCOUNT
    // =========================================================
    public double calculateDynamicDiscount(Product product) {

        double discount = 0.0;

        // -----------------------------------------------------
        // EXPIRY BASED DISCOUNT
        // -----------------------------------------------------

        if (product.getExpiryDate() != null) {

            LocalDate today = LocalDate.now();

            long daysUntilExpiry =
                    java.time.temporal.ChronoUnit.DAYS.between(
                            today,
                            product.getExpiryDate()
                    );

            // Expiring within 2 days
            if (daysUntilExpiry <= 2 && daysUntilExpiry >= 0) {
                discount = 30.0;
            }

            // Expiring within 4 days
            else if (daysUntilExpiry <= 4 && daysUntilExpiry >= 0) {
                discount = 20.0;
            }

            // Expiring within 7 days
            else if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
                discount = 10.0;
            }
        }

        // -----------------------------------------------------
        // LOW STOCK ADDITIONAL DISCOUNT
        // -----------------------------------------------------

        if (product.getQuantity() != null &&
                product.getQuantity() < 10) {

            discount = discount + 5.0;
        }

        // -----------------------------------------------------
        // MAXIMUM DISCOUNT = 50%
        // -----------------------------------------------------

        if (discount > 50.0) {
            discount = 50.0;
        }

        return discount;
    }

    // =========================================================
    // 9. APPLY DYNAMIC DISCOUNT TO ONE PRODUCT
    // =========================================================
    public Product applyDynamicDiscount(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        double discount = calculateDynamicDiscount(product);

        product.setDiscount(discount);

        return productRepository.save(product);
    }

    // =========================================================
    // 10. APPLY DYNAMIC DISCOUNT TO ALL PRODUCTS
    // =========================================================
    public List<Product> applyDynamicDiscountToAllProducts() {

        List<Product> products = productRepository.findAll();

        for (Product product : products) {

            double discount = calculateDynamicDiscount(product);

            product.setDiscount(discount);
        }

        return productRepository.saveAll(products);
    }

    // =========================================================
    // 11. STOCK IN
    // Increase product quantity
    // =========================================================
    public Product stockIn(Long id, Integer quantity) {

        if (quantity == null || quantity <= 0) {
            throw new RuntimeException(
                    "Stock quantity must be greater than 0"
            );
        }

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Integer currentQuantity = product.getQuantity();

        if (currentQuantity == null) {
            currentQuantity = 0;
        }

        product.setQuantity(currentQuantity + quantity);

        return productRepository.save(product);
    }

    // =========================================================
    // 12. STOCK OUT
    // Decrease product quantity
    // =========================================================
    public Product stockOut(Long id, Integer quantity) {

        if (quantity == null || quantity <= 0) {
            throw new RuntimeException(
                    "Stock quantity must be greater than 0"
            );
        }

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Integer currentQuantity = product.getQuantity();

        if (currentQuantity == null) {
            currentQuantity = 0;
        }

        if (quantity > currentQuantity) {
            throw new RuntimeException(
                    "Insufficient stock. Available stock: "
                            + currentQuantity
            );
        }

        product.setQuantity(currentQuantity - quantity);

        return productRepository.save(product);
    }
}