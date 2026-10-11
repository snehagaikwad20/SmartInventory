 package com.smartinventory.controller;

import com.smartinventory.entity.User;
import com.smartinventory.service.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // =========================
    // REGISTER
    // =========================
    @PostMapping("/register")
    public User register(@RequestBody User user) {

        return authService.registerUser(user);
    }

    // =========================
    // LOGIN
    // =========================
    @PostMapping("/login")
    public Map<String, Object> login(
            @RequestBody Map<String, String> request) {

        String username = request.get("username");
        String password = request.get("password");

        String token = authService.loginUser(
                username,
                password
        );

        Map<String, Object> response = new HashMap<>();

        response.put("message", "Login successful");
        response.put("username", username);
        response.put("token", token);

        return response;
    }
}