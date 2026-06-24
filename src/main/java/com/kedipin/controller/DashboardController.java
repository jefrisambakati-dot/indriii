package com.kedipin.controller;

import com.kedipin.dto.ApiResponse;
import com.kedipin.entity.Complaint;
import com.kedipin.entity.DailyStatus;
import com.kedipin.entity.TrackingLog;
import com.kedipin.entity.User;
import com.kedipin.repository.*;
import com.kedipin.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class DashboardController {

    private final UserRepository userRepository;
    private final DailyStatusRepository dailyStatusRepository;
    private final TrackingLogRepository trackingLogRepository;
    private final ComplaintRepository complaintRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userId = userDetails.getId();
        User user = userRepository.findById(userId).orElseThrow();

        LocalDate today = LocalDate.now();
        Optional<DailyStatus> todayStatus = dailyStatusRepository.findByUserIdAndStatusDate(userId, today);

        // Screen Time
        int screenMinutes = todayStatus.map(DailyStatus::getTotalScreenTime).orElse(0);
        int screenHours = screenMinutes / 60;
        int screenMins = screenMinutes % 60;
        String screenTimeStr = screenHours + " Jam " + screenMins + " Menit";

        // Yesterday comparison
        Optional<DailyStatus> yesterdayStatus = dailyStatusRepository
                .findByUserIdAndStatusDate(userId, today.minusDays(1));
        int yesterdayMinutes = yesterdayStatus.map(DailyStatus::getTotalScreenTime).orElse(0);
        int trendPct = 0;
        boolean trendUp = false;
        if (yesterdayMinutes > 0) {
            trendPct = Math.abs((screenMinutes - yesterdayMinutes) * 100 / yesterdayMinutes);
            trendUp = screenMinutes > yesterdayMinutes;
        }

        // Last tracking log (distance)
        List<TrackingLog> distanceLogs = trackingLogRepository.findTop30ByUserIdOrderByDetectedAtDesc(userId);
        double avgDistance = distanceLogs.stream()
                .mapToDouble(TrackingLog::getDistanceCm).average().orElse(40.0);
        String distanceStatus = avgDistance >= 30 ? "Aman" : "Terlalu Dekat";

        // Last break (total breaks today)
        int totalBreaks = todayStatus.map(DailyStatus::getTotalBreaks).orElse(0);
        String lastRestTime = totalBreaks > 0
                ? totalBreaks + "x istirahat"
                : "Belum ada";

        // Complaints today
        List<Complaint> complaints = complaintRepository.findTop30ByUserIdOrderByCreatedAtDesc(userId);
        String eyeComplaint = complaints.isEmpty() ? "Tidak ada" : complaints.get(0).getComplaintType();

        // Target %
        int target = user.getDailyScreenTarget() != null ? user.getDailyScreenTarget() : 240;
        int targetPct = target > 0 ? Math.min(100, (screenMinutes * 100) / target) : 0;

        // Health Score
        int healthScore = todayStatus.map(DailyStatus::getEyeHealthScore).orElse(100);

        // Weekly chart data (last 7 days screen time)
        List<Map<String, Object>> weeklyData = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            Optional<DailyStatus> ds = dailyStatusRepository.findByUserIdAndStatusDate(userId, day);
            Map<String, Object> pt = new HashMap<>();
            pt.put("date", day.format(DateTimeFormatter.ofPattern("EEE", new Locale("id"))));
            pt.put("minutes", ds.map(DailyStatus::getTotalScreenTime).orElse(0));
            weeklyData.add(pt);
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("userName", user.getName());
        data.put("screenTime", screenTimeStr);
        data.put("screenMinutes", screenMinutes);
        data.put("trendUp", trendUp);
        data.put("trendPercentage", trendPct);
        data.put("distanceStatus", distanceStatus);
        data.put("distanceValue", (int) avgDistance);
        data.put("lastRestTime", lastRestTime);
        data.put("eyeComplaint", eyeComplaint);
        data.put("targetPercentage", targetPct);
        data.put("targetMinutes", target);
        data.put("healthScore", healthScore);
        data.put("weeklyData", weeklyData);
        data.put("totalBreaks", totalBreaks);

        return ResponseEntity.ok(ApiResponse.success("Dashboard data retrieved", data));
    }
}
