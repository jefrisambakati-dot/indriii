package com.kedipin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DistanceLogRequest {
    private Long userId; // can be retrieved from auth

    @NotNull(message = "Distance is required")
    private Double distanceMeters; // matches distance_meters in payload

    private String activityType; // maps to warning message / status
}
