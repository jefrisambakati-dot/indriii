package com.kedipin.service;

import com.kedipin.dto.ComplaintRequest;
import com.kedipin.dto.DailyStatusRequest;
import com.kedipin.dto.DistanceLogRequest;
import com.kedipin.entity.Complaint;
import com.kedipin.entity.DailyStatus;
import com.kedipin.entity.TrackingLog;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface TrackingService {
    boolean logScreenDistance(Long userId, DistanceLogRequest request);
    List<TrackingLog> getUserDistanceLogs(Long userId);
    boolean logEyeComplaint(Long userId, ComplaintRequest request);
    List<Complaint> getUserComplaintLogs(Long userId);
    List<Complaint> getAllComplaintLogs();
    boolean updateDailyStatus(Long userId, DailyStatusRequest request);
    List<DailyStatus> getDailyStatusHistory(Long userId);
    DailyStatus getDailyStatus(Long userId, LocalDate date);
    Map<String, Object> getAdminDashboardStats();
}
