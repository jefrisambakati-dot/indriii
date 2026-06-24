package com.kedipin.service.impl;

import com.kedipin.dto.ExerciseRequest;
import com.kedipin.entity.EyeExercise;
import com.kedipin.entity.ExerciseLog;
import com.kedipin.entity.User;
import com.kedipin.exception.ResourceNotFoundException;
import com.kedipin.repository.EyeExerciseRepository;
import com.kedipin.repository.ExerciseLogRepository;
import com.kedipin.repository.UserRepository;
import com.kedipin.service.ExerciseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExerciseServiceImpl implements ExerciseService {

    private final EyeExerciseRepository eyeExerciseRepository;
    private final ExerciseLogRepository exerciseLogRepository;
    private final UserRepository userRepository;

    @Override
    public List<EyeExercise> getAllExercises() {
        return eyeExerciseRepository.findAll();
    }

    @Override
    public EyeExercise getExerciseById(Long exerciseId) {
        return eyeExerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found"));
    }

    @Override
    public EyeExercise createExercise(ExerciseRequest request) {
        EyeExercise exercise = EyeExercise.builder()
                .title(request.getExerciseName())
                .description(request.getDescription())
                .duration(request.getDurationSeconds())
                .thumbnail(request.getCategory()) // storing category as thumbnail/category as per old API
                .difficultyLevel("Easy")
                .instructions(request.getInstructions())
                .build();
        return eyeExerciseRepository.save(exercise);
    }

    @Override
    public boolean logExerciseCompletion(Long userId, Long exerciseId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        EyeExercise exercise = eyeExerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found"));

        ExerciseLog log = ExerciseLog.builder()
                .user(user)
                .exercise(exercise)
                .completedAt(LocalDateTime.now())
                .build();

        exerciseLogRepository.save(log);
        return true;
    }

    @Override
    public List<ExerciseLog> getUserExerciseHistory(Long userId) {
        return exerciseLogRepository.findByUserIdOrderByCompletedAtDesc(userId);
    }
}
