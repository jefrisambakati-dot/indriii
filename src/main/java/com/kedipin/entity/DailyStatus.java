package com.kedipin.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_status", uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "status_date"})})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "status_date", nullable = false)
    private LocalDate statusDate;

    @Column(name = "total_screen_time")
    private Integer totalScreenTime; // minutes

    @Column(name = "total_breaks")
    private Integer totalBreaks;

    @Column(name = "avg_distance")
    private Double avgDistance;

    @Column(name = "eye_health_score")
    private Integer eyeHealthScore;

    private String mood;

    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (totalScreenTime == null) totalScreenTime = 0;
        if (totalBreaks == null) totalBreaks = 0;
        if (avgDistance == null) avgDistance = 0.0;
        if (eyeHealthScore == null) eyeHealthScore = 100;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
