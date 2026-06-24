package com.kedipin.service;

import com.kedipin.dto.ExerciseRequest;
import com.kedipin.entity.EyeExercise;
import com.kedipin.entity.ExerciseLog;

import java.util.List;

public interface ExerciseService {
    List<EyeExercise> getAllExercises();
    EyeExercise getExerciseById(Long exerciseId);
    EyeExercise createExercise(ExerciseRequest request);
    boolean logExerciseCompletion(Long userId, Long exerciseId);
    List<ExerciseLog> getUserExerciseHistory(Long userId);
}
