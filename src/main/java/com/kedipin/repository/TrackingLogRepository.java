package com.kedipin.repository;

import com.kedipin.entity.TrackingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrackingLogRepository extends JpaRepository<TrackingLog, Long> {
    List<TrackingLog> findTop30ByUserIdOrderByDetectedAtDesc(Long userId);
}
