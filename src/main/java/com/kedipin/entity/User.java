package com.kedipin.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    // Field ini ditambahkan untuk mengatasi error "cannot find symbol"
    private String occupation;

    @Column(length = 50)
    private String role; // "USER" or "SUPER_ADMIN"

    private Integer age;

    @Column(length = 50)
    private String gender;

    @Column(name = "profile_picture")
    private String profilePicture;

    @Column(name = "daily_screen_target")
    private Integer dailyScreenTarget;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
        if (dailyScreenTarget == null) {
            dailyScreenTarget = 240;
        }
        if (role == null) {
            role = "USER";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}