package com.kedipin.service;

import com.kedipin.dto.AuthRequest;
import com.kedipin.dto.AuthResponse;
import com.kedipin.dto.RegisterRequest;

public interface AuthService {
    boolean registerUser(RegisterRequest request);
    AuthResponse loginUser(AuthRequest request);
}
