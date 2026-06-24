package com.kedipin.config;

import com.kedipin.entity.Admin;
import com.kedipin.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        try {
            if (!adminRepository.existsByEmail("admin@kedipin.com") && !adminRepository.existsByUsername("admin")) {
                Admin admin = Admin.builder()
                        .username("admin")
                        .email("admin@kedipin.com")
                        .password(passwordEncoder.encode("KedipinSafeAdmin2026!"))
                        .build();
                adminRepository.save(admin);
                System.out.println("Default admin created successfully: admin@kedipin.com / KedipinSafeAdmin2026!");
            } else {
                adminRepository.findByEmail("admin@kedipin.com").ifPresent(admin -> {
                    admin.setPassword(passwordEncoder.encode("KedipinSafeAdmin2026!"));
                    adminRepository.save(admin);
                    System.out.println("Admin credentials reset to KedipinSafeAdmin2026!");
                });
            }
        } catch (Exception e) {
            System.err.println("Admin seeding failed, falling back to ID 1 update: " + e.getMessage());
            try {
                adminRepository.findById(1L).ifPresent(admin -> {
                    admin.setEmail("admin@kedipin.com");
                    admin.setUsername("admin");
                    admin.setPassword(passwordEncoder.encode("KedipinSafeAdmin2026!"));
                    adminRepository.save(admin);
                    System.out.println("Admin at ID 1 updated to admin@kedipin.com / KedipinSafeAdmin2026!");
                });
            } catch (Exception ex) {
                System.err.println("Fallback admin update failed: " + ex.getMessage());
            }
        }
    }
}
