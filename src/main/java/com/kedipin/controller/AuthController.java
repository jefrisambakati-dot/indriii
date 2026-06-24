package com.kedipin.controller;

import com.kedipin.dto.ApiResponse;
import com.kedipin.dto.AuthRequest;
import com.kedipin.dto.AuthResponse;
import com.kedipin.dto.RegisterRequest;
import com.kedipin.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthResponse>> signUp(@Valid @RequestBody RegisterRequest request) {
        authService.registerUser(request);
        // Automatically login after successful registration to match old flow returning token
        AuthRequest authRequest = new AuthRequest();
        authRequest.setUsername(request.getEmail());
        authRequest.setPassword(request.getPassword());
        AuthResponse response = authService.loginUser(authRequest);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.loginUser(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
}
