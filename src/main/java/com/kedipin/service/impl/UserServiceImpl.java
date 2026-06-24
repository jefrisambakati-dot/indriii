package com.kedipin.service.impl;

import com.kedipin.dto.ProfileUpdateRequest;
import com.kedipin.entity.User;
import com.kedipin.exception.BadRequestException;
import com.kedipin.exception.ResourceNotFoundException;
import com.kedipin.repository.UserRepository;
import com.kedipin.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public boolean updateUserProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setName(request.getName());
        user.setAge(request.getAge());
        user.setGender(request.getGender());
        user.setOccupation(request.getOccupation());
        if (request.getDailyScreenTarget() != null) {
            user.setDailyScreenTarget(request.getDailyScreenTarget());
        }

        userRepository.save(user);
        return true;
    }

    @Override
    public User getUserProfile(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public boolean deactivateUserAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setIsActive(false);
        userRepository.save(user);
        return true;
    }

    @Override
    public long getUserCount() {
        return userRepository.count();
    }

    @Override
    public boolean isUserActive(Long userId) {
        return userRepository.findById(userId)
                .map(User::getIsActive)
                .orElse(false);
    }
}
