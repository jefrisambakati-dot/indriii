package com.kedipin.controller;

import com.kedipin.dto.ApiResponse;
import com.kedipin.entity.Complaint;
import com.kedipin.entity.User;
import com.kedipin.repository.TrackingLogRepository;
import com.kedipin.service.TrackingService;
import com.kedipin.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final TrackingService trackingService;
    private final TrackingLogRepository trackingLogRepository;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> list = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", list));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        Map<String, Object> stats = trackingService.getAdminDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Statistics retrieved", stats));
    }

    @GetMapping("/complaints")
    public ResponseEntity<ApiResponse<List<Complaint>>> getAllComplaints() {
        List<Complaint> complaints = trackingService.getAllComplaintLogs();
        return ResponseEntity.ok(ApiResponse.success("Complaint logs retrieved", complaints));
    }

    @GetMapping("/tracking-history")
    public ResponseEntity<ApiResponse<Object>> getTrackingHistory() {
        // Expose top 100 tracking logs for simple history view
        return ResponseEntity.ok(ApiResponse.success("Tracking history retrieved", trackingLogRepository.findAll()));
    }
}