package com.kedipin.service.impl;

import com.kedipin.dto.ComplaintRequest;
import com.kedipin.dto.DailyStatusRequest;
import com.kedipin.dto.DistanceLogRequest;
import com.kedipin.entity.Complaint;
import com.kedipin.entity.DailyStatus;
import com.kedipin.entity.TrackingLog;
import com.kedipin.entity.User;
import com.kedipin.exception.ResourceNotFoundException;
import com.kedipin.repository.*;
import com.kedipin.service.TrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TrackingServiceImpl implements TrackingService {

    private final TrackingLogRepository trackingLogRepository;
    private final ComplaintRepository complaintRepository;
    private final DailyStatusRepository dailyStatusRepository;
    private final UserRepository userRepository;
    private final EyeExerciseRepository eyeExerciseRepository;
    private final ExerciseLogRepository exerciseLogRepository;

    private static final double SAFE_DISTANCE = 30.0;
    private static final double WARNING_DISTANCE = 20.0;

    @Override
    public boolean logScreenDistance(Long userId, DistanceLogRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Double distance = request.getDistanceMeters(); // value is actually in cm/meters depending on client, we store it
        String status = "Safe";
        if (distance < WARNING_DISTANCE) {
            status = "WARNING";
        } else if (distance < SAFE_DISTANCE) {
            status = "WARNING";
        }

        TrackingLog log = TrackingLog.builder()
                .user(user)
                .distanceCm(distance)
                .status(status)
                .build();

        trackingLogRepository.save(log);
        return true;
    }

    @Override
    public List<TrackingLog> getUserDistanceLogs(Long userId) {
        return trackingLogRepository.findTop30ByUserIdOrderByDetectedAtDesc(userId);
    }

    @Override
    public boolean logEyeComplaint(Long userId, ComplaintRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Complaint complaint = Complaint.builder()
                .user(user)
                .complaintType(request.getComplaintType())
                .severity(request.getSeverityLevel())
                .notes(request.getNotes())
                .build();

        complaintRepository.save(complaint);
        return true;
    }

    @Override
    public List<Complaint> getUserComplaintLogs(Long userId) {
        return complaintRepository.findTop30ByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<Complaint> getAllComplaintLogs() {
        return complaintRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public boolean updateDailyStatus(Long userId, DailyStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        LocalDate date = LocalDate.parse(request.getDate());
        DailyStatus dailyStatus = dailyStatusRepository.findByUserIdAndStatusDate(userId, date)
                .orElse(DailyStatus.builder().user(user).statusDate(date).build());

        if (request.getScreenTimeMinutes() != null) {
            dailyStatus.setTotalScreenTime(request.getScreenTimeMinutes());
        }
        if (request.getTotalBreaks() != null) {
            dailyStatus.setTotalBreaks(request.getTotalBreaks());
        }
        if (request.getAvgDistance() != null) {
            dailyStatus.setAvgDistance(request.getAvgDistance());
        }
        if (request.getEyeHealthScore() != null) {
            dailyStatus.setEyeHealthScore(request.getEyeHealthScore());
        }
        if (request.getMood() != null) {
            dailyStatus.setMood(request.getMood());
        }
        if (request.getNotes() != null) {
            dailyStatus.setNotes(request.getNotes());
        }

        // Auto-calculate simple health score if not set
        if (dailyStatus.getEyeHealthScore() == null || dailyStatus.getEyeHealthScore() == 100) {
            int score = 100;
            if (dailyStatus.getTotalScreenTime() > 480) score -= 40;
            else if (dailyStatus.getTotalScreenTime() > 240) score -= 20;

            if (dailyStatus.getTotalBreaks() < 4) score -= 15;
            dailyStatus.setEyeHealthScore(Math.max(0, score));
        }

        dailyStatusRepository.save(dailyStatus);
        return true;
    }

    @Override
    public List<DailyStatus> getDailyStatusHistory(Long userId) {
        return dailyStatusRepository.findByUserIdOrderByStatusDateDesc(userId);
    }

    @Override
    public DailyStatus getDailyStatus(Long userId, LocalDate date) {
        return dailyStatusRepository.findByUserIdAndStatusDate(userId, date)
                .orElse(null);
    }

    @Override
    public Map<String, Object> getAdminDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalComplaints", complaintRepository.count());
        stats.put("totalTrackingLogs", trackingLogRepository.count());
        stats.put("totalExercises", eyeExerciseRepository.count());
        stats.put("totalExerciseLogs", exerciseLogRepository.count());
        return stats;
    }
}
