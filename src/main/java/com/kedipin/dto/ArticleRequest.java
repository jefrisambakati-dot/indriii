package com.kedipin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ArticleRequest {
    @NotBlank(message = "Title cannot be empty")
    private String title;

    @NotBlank(message = "Content cannot be empty")
    private String content;

    private String category;
    private String excerpt; // map to thumbnail column
    private String authorId; // map to author column
    private boolean isPublished;
}
