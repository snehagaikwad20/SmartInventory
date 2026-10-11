package com.smartinventory.service;

import com.smartinventory.entity.User;
import com.smartinventory.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // =========================
    // REGISTER USER
    // =========================
    public User registerUser(User user) {

        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Encrypt password before saving
        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        // Default role
        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("STAFF");
        }

        return userRepository.save(user);
    }

    // =========================
    // LOGIN USER
    // =========================
    public String loginUser(String username, String password) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invalid username or password"
                        )
                );

        // Check password
        if (!passwordEncoder.matches(
                password,
                user.getPassword())) {

            throw new RuntimeException(
                    "Invalid username or password"
            );
        }

        // Generate JWT token
        return jwtService.generateToken(
                user.getUsername()
        );
    }
}