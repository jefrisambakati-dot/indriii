package com.kedipin.security;

import com.kedipin.entity.Admin;
import com.kedipin.entity.User;
import com.kedipin.repository.AdminRepository;
import com.kedipin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        // 1. Check if it's an admin first
        Optional<Admin> adminOpt = adminRepository.findByUsername(usernameOrEmail);
        if (adminOpt.isEmpty()) {
            adminOpt = adminRepository.findByEmail(usernameOrEmail);
        }
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            return new CustomUserDetails(admin.getId(), admin.getUsername(), admin.getEmail(), admin.getPassword(), "SUPER_ADMIN");
        }

        // 2. Check if it's a regular user
        Optional<User> userOpt = userRepository.findByEmail(usernameOrEmail);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByName(usernameOrEmail);
        }
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (Boolean.FALSE.equals(user.getIsActive())) {
                throw new UsernameNotFoundException("User account is inactive");
            }
            return new CustomUserDetails(user.getId(), user.getName(), user.getEmail(), user.getPassword(), user.getRole());
        }

        throw new UsernameNotFoundException("User not found with username or email: " + usernameOrEmail);
    }

    public UserDetails loadUserByIdAndRole(Long id, String role) {
        if ("SUPER_ADMIN".equalsIgnoreCase(role)) {
            Admin admin = adminRepository.findById(id)
                    .orElseThrow(() -> new UsernameNotFoundException("Admin not found with id: " + id));
            return new CustomUserDetails(admin.getId(), admin.getUsername(), admin.getEmail(), admin.getPassword(), "SUPER_ADMIN");
        } else {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));
            return new CustomUserDetails(user.getId(), user.getName(), user.getEmail(), user.getPassword(), user.getRole());
        }
    }
}
