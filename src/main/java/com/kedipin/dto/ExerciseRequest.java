package com.kedipin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ExerciseRequest {
    @NotBlank(message = "Exercise name cannot be empty")
    private String exerciseName;

    private String description;

    @NotNull(message = "Duration is required")
    private Integer durationSeconds;

    private String category;
    private Integer repetitions;
    private String instructions;
}
