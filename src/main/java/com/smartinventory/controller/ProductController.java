package com.smartinventory.controller;

import com.smartinventory.entity.Product;
import com.smartinventory.service.ProductService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // =========================================================
    // 1. GET ALL PRODUCTS
    // =========================================================
    @GetMapping
    public List<Product> getAllProducts() {
        return productService.getAllProducts();
    }

    // =========================================================
    // 2. GET PRODUCT BY ID
    // =========================================================
    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    // =========================================================
    // 3. ADD PRODUCT
    // =========================================================
    @PostMapping
    public Product addProduct(@RequestBody Product product) {
        return productService.addProduct(product);
    }

    // =========================================================
    // 4. UPDATE PRODUCT
    // =========================================================
    @PutMapping("/{id}")
    public Product updateProduct(
            @PathVariable Long id,
            @RequestBody Product product) {

        return productService.updateProduct(id, product);
    }

    // =========================================================
    // 5. DELETE PRODUCT
    // =========================================================
    @DeleteMapping("/{id}")
    public String deleteProduct(@PathVariable Long id) {

        productService.deleteProduct(id);

        return "Product deleted successfully";
    }

    // =========================================================
    // 6. GET PRODUCTS NEAR EXPIRY
    // =========================================================
    @GetMapping("/near-expiry")
    public List<Product> getNearExpiryProducts() {
        return productService.getNearExpiryProducts();
    }

    // =========================================================
    // 7. GET LOW STOCK PRODUCTS
    // =========================================================
    @GetMapping("/low-stock")
    public List<Product> getLowStockProducts() {
        return productService.getLowStockProducts();
    }

    // =========================================================
    // 8. CALCULATE DYNAMIC DISCOUNT
    // =========================================================
    @GetMapping("/{id}/dynamic-discount")
    public double calculateDynamicDiscount(@PathVariable Long id) {

        Product product = productService.getProductById(id);

        return productService.calculateDynamicDiscount(product);
    }

    // =========================================================
    // 9. APPLY DYNAMIC DISCOUNT TO ONE PRODUCT
    // =========================================================
    @PutMapping("/{id}/apply-discount")
    public Product applyDynamicDiscount(@PathVariable Long id) {

        return productService.applyDynamicDiscount(id);
    }

    // =========================================================
    // 10. APPLY DYNAMIC DISCOUNT TO ALL PRODUCTS
    // =========================================================
    @PutMapping("/apply-discount-all")
    public List<Product> applyDynamicDiscountToAllProducts() {

        return productService.applyDynamicDiscountToAllProducts();
    }

    // =========================================================
    // 11. STOCK IN
    // Increase product quantity
    // =========================================================
    @PostMapping("/{id}/stock-in")
    public Product stockIn(
            @PathVariable Long id,
            @RequestParam Integer quantity) {

        return productService.stockIn(id, quantity);
    }

    // =========================================================
    // 12. STOCK OUT
    // Decrease product quantity
    // =========================================================
    @PostMapping("/{id}/stock-out")
    public Product stockOut(
            @PathVariable Long id,
            @RequestParam Integer quantity) {

        return productService.stockOut(id, quantity);
    }
}