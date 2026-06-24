package com.kedipin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private Long id; // optional for matching logic, but profile update can read authenticated user id

    @NotBlank(message = "Name cannot be empty")
    private String name;

    private Integer age;
    private String gender;
    private String occupation;
    private Integer dailyScreenTarget;
}
