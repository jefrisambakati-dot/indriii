package com.kedipin.controller;

import com.kedipin.dto.ApiResponse;
import com.kedipin.dto.ProfileUpdateRequest;
import com.kedipin.entity.User;
import com.kedipin.security.CustomUserDetails;
import com.kedipin.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/profile")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<User>> getProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Long userId) {
        Long targetId = (userId != null) ? userId : userDetails.getId();
        User profile = userService.getUserProfile(targetId);
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", profile));
    }

    @PostMapping("/update")
    public ResponseEntity<ApiResponse<Void>> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ProfileUpdateRequest request) {
        // Fallback to authenticated user id if id in request is missing
        Long targetId = (request.getId() != null) ? request.getId() : userDetails.getId();
        userService.updateUserProfile(targetId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully"));
    }
}
