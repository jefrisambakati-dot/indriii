package com.kedipin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DailyStatusRequest {
    private Long userId; // can be retrieved from auth

    @NotBlank(message = "Date is required")
    private String date; // YYYY-MM-DD

    private Integer screenTimeMinutes;
    private Integer totalBreaks;
    private Double avgDistance;
    private Integer eyeHealthScore;
    private String mood;
    private String notes;
}
