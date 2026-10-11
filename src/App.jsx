import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080";

const EMPTY_PRODUCT = {
  name: "",
  category: "",
  quantity: "",
  price: "",
  expiryDate: "",
  discount: 0,
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
const [categoryFilter, setCategoryFilter] = useState("All");
const [sortBy, setSortBy] = useState("default");
  const [lowStock, setLowStock] = useState([]);
  const [nearExpiry, setNearExpiry] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [editingProductId, setEditingProductId] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const token = () => localStorage.getItem("token");

  async function apiRequest(path, options = {}) {
    const currentToken = token();
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      setIsLoggedIn(false);
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      const text = await response.text();
      let message = text || `Request failed (${response.status})`;
      try {
        const parsed = JSON.parse(text);
        message = parsed.message || parsed.error || message;
      } catch {
        // The server response was plain text.
      }
      throw new Error(message);
    }

    if (response.status === 204) return null;
    const responseText = await response.text();
    if (!responseText) return null;

    try {
      return JSON.parse(responseText);
    } catch {
      return responseText;
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid username or password");
      }
      if (!data.token) {
        throw new Error("Login response did not contain a token.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username || username);
      setIsLoggedIn(true);
      setPassword("");
      setError("");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function loadDashboardData() {
    setLoading(true);
    setError("");

    try {
      const [productsData, lowStockData, nearExpiryData] = await Promise.all([
        apiRequest("/api/products"),
        apiRequest("/api/products/low-stock"),
        apiRequest("/api/products/near-expiry"),
      ]);

      setProducts(Array.isArray(productsData) ? productsData : []);
      setLowStock(Array.isArray(lowStockData) ? lowStockData : []);
      setNearExpiry(Array.isArray(nearExpiryData) ? nearExpiryData : []);
    } catch (err) {
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn) loadDashboardData();
    // Load data when the login state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setProducts([]);
    setLowStock([]);
    setNearExpiry([]);
    setIsLoggedIn(false);
    setShowProductForm(false);
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT);
    setError("");
    setSuccess("");
  }

  function handleAddProductClick() {
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT);
    setShowProductForm(true);
    setError("");
    setSuccess("");
  }

  function handleProductChange(event) {
    const { name, value } = event.target;
    setProductForm((current) => ({ ...current, [name]: value }));
  }

  function handleEditProduct(product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name ?? "",
      category: product.category ?? "",
      quantity: product.quantity ?? "",
      price: product.price ?? "",
      expiryDate: product.expiryDate ?? "",
      discount: product.discount ?? 0,
    });
    setShowProductForm(true);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    setSavingProduct(true);
    setError("");
    setSuccess("");

    const payload = {
      name: productForm.name.trim(),
      category: productForm.category.trim(),
      quantity: Number(productForm.quantity),
      price: Number(productForm.price),
      expiryDate: productForm.expiryDate || null,
      discount: Number(productForm.discount || 0),
    };

    if (!payload.name || !payload.category) {
      setError("Please enter product name and category.");
      setSavingProduct(false);
      return;
    }
    if (!Number.isFinite(payload.quantity) || payload.quantity < 0) {
      setError("Quantity must be zero or greater.");
      setSavingProduct(false);
      return;
    }
    if (!Number.isFinite(payload.price) || payload.price < 0) {
      setError("Price must be zero or greater.");
      setSavingProduct(false);
      return;
    }

    try {
      const isEditing = editingProductId !== null;
      const path = isEditing
        ? `/api/products/${editingProductId}`
        : "/api/products";

      await apiRequest(path, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      setSuccess(isEditing ? "Product updated successfully." : "Product added successfully.");
      setShowProductForm(false);
      setEditingProductId(null);
      setProductForm(EMPTY_PRODUCT);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || "Unable to save product.");
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiRequest(`/api/products/${product.id}`, { method: "DELETE" });
      setSuccess("Product deleted successfully.");
      await loadDashboardData();
    } catch (err) {
      setError(err.message || "Unable to delete product.");
    }
  }

  async function applyDiscountToAll() {
    const confirmed = window.confirm(
      "Apply rule-based dynamic discounts to all products?"
    );
    if (!confirmed) return;

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest("/api/products/apply-discount-all", { method: "PUT" });
      setSuccess("Dynamic discounts applied successfully.");
      await loadDashboardData();
    } catch (err) {
      setError(err.message || "Failed to apply dynamic discounts.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStockAction(product, action) {
    const actionLabel = action === "stock-in" ? "add to stock" : "remove from stock";
    const input = window.prompt(
      `Enter quantity to ${actionLabel} for ${product.name}:`
    );
    if (input === null) return;

    const quantity = Number(input);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Please enter a whole number greater than zero.");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/api/products/${product.id}/${action}?quantity=${encodeURIComponent(quantity)}`,
        { method: "POST" }
      );
      setSuccess(
        action === "stock-in"
          ? `Stock increased for ${product.name}.`
          : `Stock reduced for ${product.name}.`
      );
      await loadDashboardData();
    } catch (err) {
      setError(err.message || "Stock update failed.");
    } finally {
      setActionLoading(false);
    }
  }
  
const categories = [
  "All",
  ...new Set(
    products
      .map((product) => product.category)
      .filter(Boolean)
  ),
];

const filteredProducts = products
  .filter((product) => {
    const matchesSearch =
      (product.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" ||
      product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  })
  .sort((a, b) => {
    if (sortBy === "name") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (sortBy === "price-low") {
      return Number(a.price || 0) - Number(b.price || 0);
    }
    if (sortBy === "quantity-low") {
      return Number(a.quantity || 0) - Number(b.quantity || 0);
    }
    return 0;
  });


  const totalStock = products.reduce(
    (total, product) => total + (Number(product.quantity) || 0),
    0
  );
  const discountedProducts = products.filter(
    (product) => Number(product.discount || 0) > 0
  ).length;

  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-icon">📦</div>
          <h1>Smart Inventory</h1>
          <p>Inventory &amp; Dynamic Discount Management</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleLogin}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            <button type="submit" disabled={loginLoading}>
              {loginLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Smart Inventory</h1>
          <p>Inventory &amp; Dynamic Discount Management</p>
          <small>
            Welcome, {localStorage.getItem("username") || "Admin"}
          </small>
        </div>

        <div className="header-actions">
          <button
            className="refresh-btn"
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button className="logout-btn" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="success-message" role="status">
            {success}
            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading dashboard...</div>
        ) : (
          <>
            <section className="cards">
              <div className="card">
                <div className="card-icon">📦</div>
                <h3>Total Products</h3>
                <h2>{products.length}</h2>
              </div>
              <div className="card">
                <div className="card-icon">📊</div>
                <h3>Total Stock</h3>
                <h2>{totalStock}</h2>
              </div>
              <div className="card warning">
                <div className="card-icon">⚠️</div>
                <h3>Low Stock</h3>
                <h2>{lowStock.length}</h2>
              </div>
              <div className="card danger">
                <div className="card-icon">⏰</div>
                <h3>Near Expiry</h3>
                <h2>{nearExpiry.length}</h2>
              </div>
              <div className="card discount">
                <div className="card-icon">💰</div>
                <h3>Discounted Products</h3>
                <h2>{discountedProducts}</h2>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="section-header">
                <h2>Product Management</h2>
                <div className="product-actions">
                  <button
                    className="add-product-btn"
                    type="button"
                    onClick={handleAddProductClick}
                  >
                    + Add Product
                  </button>
                  <button
                    className="discount-btn"
                    type="button"
                    onClick={applyDiscountToAll}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Please wait..." : "Apply Dynamic Discount"}
                  </button>
                </div>
              </div>
              
<div className="product-filters">
  <input
    type="text"
    placeholder="Search products..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />

  <select
    value={categoryFilter}
    onChange={(e) => setCategoryFilter(e.target.value)}
  >
    {categories.map((category) => (
      <option key={category} value={category}>
        {category}
      </option>
    ))}
  </select>

  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
  >
    <option value="default">Default Order</option>
    <option value="name">Name (A–Z)</option>
    <option value="price-low">Price (Low to High)</option>
    <option value="quantity-low">Quantity (Low to High)</option>
  </select>
</div>


              {showProductForm && (
                <div className="product-form-card">
                  <h2>{editingProductId !== null ? "Edit Product" : "Add New Product"}</h2>
                  <form onSubmit={handleProductSubmit}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="product-name">Product Name</label>
                        <input
                          id="product-name"
                          name="name"
                          type="text"
                          placeholder="Enter product name"
                          value={productForm.name}
                          onChange={handleProductChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="product-category">Category</label>
                        <input
                          id="product-category"
                          name="category"
                          type="text"
                          placeholder="Enter category"
                          value={productForm.category}
                          onChange={handleProductChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="product-quantity">Quantity</label>
                        <input
                          id="product-quantity"
                          name="quantity"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Enter quantity"
                          value={productForm.quantity}
                          onChange={handleProductChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="product-price">Price (₹)</label>
                        <input
                          id="product-price"
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Enter price"
                          value={productForm.price}
                          onChange={handleProductChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="product-expiry">Expiry Date</label>
                        <input
                          id="product-expiry"
                          name="expiryDate"
                          type="date"
                          value={productForm.expiryDate || ""}
                          onChange={handleProductChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="product-discount">Discount (%)</label>
                        <input
                          id="product-discount"
                          name="discount"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={productForm.discount}
                          onChange={handleProductChange}
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" disabled={savingProduct}>
                        {savingProduct
                          ? "Saving..."
                          : editingProductId !== null
                          ? "Update Product"
                          : "Save Product"}
                      </button>
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => {
                          setShowProductForm(false);
                          setEditingProductId(null);
                          setProductForm(EMPTY_PRODUCT);
                          setError("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Expiry Date</th>
                      <th>Discount</th>
                      <th>Stock Actions</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="empty-state">
                          No products found. Click “Add Product” to create one.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td>{product.id}</td>
                          <td>{product.name}</td>
                          <td>{product.category}</td>
                          <td>
                            <span
                              className={
                                Number(product.quantity) < 10
                                  ? "quantity-low"
                                  : ""
                              }
                            >
                              {product.quantity ?? 0}
                            </span>
                          </td>
                          <td>₹{Number(product.price || 0).toFixed(2)}</td>
                          <td>{product.expiryDate || "—"}</td>
                          <td>{Number(product.discount || 0)}%</td>
                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="stock-in-btn"
                                disabled={actionLoading}
                                onClick={() => handleStockAction(product, "stock-in")}
                              >
                                Stock In
                              </button>
                              <button
                                type="button"
                                className="stock-out-btn"
                                disabled={actionLoading}
                                onClick={() => handleStockAction(product, "stock-out")}
                              >
                                Stock Out
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="edit-btn"
                                onClick={() => handleEditProduct(product)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="delete-btn"
                                onClick={() => handleDeleteProduct(product)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="alerts">
              <div className="alert-box">
                <h2>⚠️ Low Stock Products</h2>
                {lowStock.length === 0 ? (
                  <p className="success">No low stock products.</p>
                ) : (
                  lowStock.map((product) => (
                    <div className="alert-item" key={product.id}>
                      <span>{product.name}</span>
                      <strong>{product.quantity ?? 0} units</strong>
                    </div>
                  ))
                )}
              </div>

              <div className="alert-box">
                <h2>⏰ Near Expiry Products</h2>
                {nearExpiry.length === 0 ? (
                  <p className="success">No near-expiry products.</p>
                ) : (
                  nearExpiry.map((product) => (
                    <div className="alert-item" key={product.id}>
                      <span>{product.name}</span>
                      <strong>{product.expiryDate || "Expiry date unavailable"}</strong>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
