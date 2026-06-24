package com.kedipin.service.impl;

import com.kedipin.dto.AuthRequest;
import com.kedipin.dto.AuthResponse;
import com.kedipin.dto.RegisterRequest;
import com.kedipin.entity.Admin;
import com.kedipin.entity.User;
import com.kedipin.exception.BadRequestException;
import com.kedipin.repository.AdminRepository;
import com.kedipin.repository.UserRepository;
import com.kedipin.security.JwtTokenProvider;
import com.kedipin.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @Override
    public boolean registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail()) || adminRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use");
        }
        if (userRepository.existsByName(request.getName())) {
            throw new BadRequestException("Username already in use");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .age(request.getAge())
                .gender(request.getGender())
                .occupation(request.getOccupation())
                .role("USER")
                .isActive(true)
                .build();

        userRepository.save(user);
        return true;
    }

    @Override
    public AuthResponse loginUser(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        // Retrieve additional user info to return
        String role = tokenProvider.getRoleFromJWT(jwt);
        Long id = tokenProvider.getUserIdFromJWT(jwt);

        AuthResponse.UserDto userDto = AuthResponse.UserDto.builder()
                .id(id)
                .role(role)
                .build();

        if ("SUPER_ADMIN".equalsIgnoreCase(role)) {
            Optional<Admin> admin = adminRepository.findById(id);
            admin.ifPresent(value -> {
                userDto.setEmail(value.getEmail());
                userDto.setName(value.getUsername());
            });
        } else {
            Optional<User> user = userRepository.findById(id);
            user.ifPresent(value -> {
                userDto.setEmail(value.getEmail());
                userDto.setName(value.getName());
            });
        }

        return AuthResponse.builder()
                .accessToken(jwt)
                .user(userDto)
                .build();
    }
}
