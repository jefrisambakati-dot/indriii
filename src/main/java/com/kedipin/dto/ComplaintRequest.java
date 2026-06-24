package com.kedipin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ComplaintRequest {
    private Long userId; // can be retrieved from authentication context

    @NotBlank(message = "Complaint type cannot be empty")
    private String complaintType;

    @NotNull(message = "Severity level is required")
    private Integer severityLevel;

    private String notes;
}
