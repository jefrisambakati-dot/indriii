package com.kedipin.controller;

import com.kedipin.dto.ApiResponse;
import com.kedipin.dto.ExerciseRequest;
import com.kedipin.entity.EyeExercise;
import com.kedipin.security.CustomUserDetails;
import com.kedipin.service.ExerciseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ExerciseController {

    private final ExerciseService exerciseService;

    @GetMapping("/api/user/exercises")
    public ResponseEntity<ApiResponse<List<EyeExercise>>> getAllExercises() {
        List<EyeExercise> list = exerciseService.getAllExercises();
        return ResponseEntity.ok(ApiResponse.success("Exercises retrieved successfully", list));
    }

    @PostMapping("/api/user/exercises/complete/{id}")
    public ResponseEntity<ApiResponse<Void>> completeExercise(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        exerciseService.logExerciseCompletion(userDetails.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Exercise completed logged successfully"));
    }

    @PostMapping("/api/admin/exercises")
    public ResponseEntity<ApiResponse<EyeExercise>> createExercise(@Valid @RequestBody ExerciseRequest request) {
        EyeExercise created = exerciseService.createExercise(request);
        return ResponseEntity.ok(ApiResponse.success("Exercise created successfully", created));
    }
}
