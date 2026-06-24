package com.kedipin.service;

import com.kedipin.dto.ProfileUpdateRequest;
import com.kedipin.entity.User;

import java.util.List;

public interface UserService {
    boolean updateUserProfile(Long userId, ProfileUpdateRequest request);
    User getUserProfile(Long userId);
    List<User> getAllUsers();
    boolean deactivateUserAccount(Long userId);
    long getUserCount();
    boolean isUserActive(Long userId);
}