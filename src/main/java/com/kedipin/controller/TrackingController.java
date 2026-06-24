package com.kedipin.controller;

import com.kedipin.dto.ApiResponse;
import com.kedipin.dto.ComplaintRequest;
import com.kedipin.dto.DailyStatusRequest;
import com.kedipin.dto.DistanceLogRequest;
import com.kedipin.entity.Complaint;
import com.kedipin.entity.DailyStatus;
import com.kedipin.entity.TrackingLog;
import com.kedipin.security.CustomUserDetails;
import com.kedipin.service.TrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/tracking")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingService trackingService;

    @GetMapping("/distance")
    public ResponseEntity<ApiResponse<List<TrackingLog>>> getDistanceLogs(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Long userId) {
        Long targetId = (userId != null) ? userId : userDetails.getId();
        List<TrackingLog> logs = trackingService.getUserDistanceLogs(targetId);
        return ResponseEntity.ok(ApiResponse.success("Distance logs retrieved", logs));
    }

    @PostMapping("/distance")
    public ResponseEntity<ApiResponse<Void>> logDistance(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody DistanceLogRequest request) {
        Long targetId = (request.getUserId() != null) ? request.getUserId() : userDetails.getId();
        trackingService.logScreenDistance(targetId, request);
        return ResponseEntity.ok(ApiResponse.success("Distance log saved"));
    }

    @GetMapping("/complaint")
    public ResponseEntity<ApiResponse<List<Complaint>>> getComplaintLogs(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Long userId) {
        Long targetId = (userId != null) ? userId : userDetails.getId();
        List<Complaint> logs = trackingService.getUserComplaintLogs(targetId);
        return ResponseEntity.ok(ApiResponse.success("Complaint logs retrieved", logs));
    }

    @PostMapping("/complaint")
    public ResponseEntity<ApiResponse<Void>> logComplaint(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ComplaintRequest request) {
        Long targetId = (request.getUserId() != null) ? request.getUserId() : userDetails.getId();
        trackingService.logEyeComplaint(targetId, request);
        return ResponseEntity.ok(ApiResponse.success("Complaint log saved"));
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<List<DailyStatus>>> getDailyStatusHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Long userId) {
        Long targetId = (userId != null) ? userId : userDetails.getId();
        List<DailyStatus> history = trackingService.getDailyStatusHistory(targetId);
        return ResponseEntity.ok(ApiResponse.success("Daily status history retrieved", history));
    }

    @PostMapping("/daily")
    public ResponseEntity<ApiResponse<Void>> updateDailyStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody DailyStatusRequest request) {
        Long targetId = (request.getUserId() != null) ? request.getUserId() : userDetails.getId();
        trackingService.updateDailyStatus(targetId, request);
        return ResponseEntity.ok(ApiResponse.success("Daily status updated"));
    }
}
