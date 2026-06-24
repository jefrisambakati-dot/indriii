package com.kedipin.repository;

import com.kedipin.entity.DailyStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyStatusRepository extends JpaRepository<DailyStatus, Long> {
    Optional<DailyStatus> findByUserIdAndStatusDate(Long userId, LocalDate date);
    List<DailyStatus> findByUserIdOrderByStatusDateDesc(Long userId);
}
