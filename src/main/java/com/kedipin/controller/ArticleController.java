package com.kedipin.controller;

import com.kedipin.dto.ApiResponse;
import com.kedipin.dto.ArticleRequest;
import com.kedipin.entity.Article;
import com.kedipin.service.ArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    @GetMapping("/api/public/articles")
    public ResponseEntity<ApiResponse<List<Article>>> getPublicArticles() {
        List<Article> list = articleService.getAllArticles(true);
        return ResponseEntity.ok(ApiResponse.success("Articles retrieved", list));
    }

    @GetMapping("/api/articles") // Let's also support direct path as requested
    public ResponseEntity<ApiResponse<List<Article>>> getAllArticles() {
        List<Article> list = articleService.getAllArticles(false);
        return ResponseEntity.ok(ApiResponse.success("All articles retrieved", list));
    }

    @GetMapping("/api/user/articles")  // Alias for authenticated users from dashboard
    public ResponseEntity<ApiResponse<List<Article>>> getUserArticles() {
        List<Article> list = articleService.getAllArticles(true);
        return ResponseEntity.ok(ApiResponse.success("Articles retrieved", list));
    }

    @GetMapping("/api/articles/{id}")
    public ResponseEntity<ApiResponse<Article>> getArticleById(@PathVariable Long id) {
        Article article = articleService.getArticleById(id);
        return ResponseEntity.ok(ApiResponse.success("Article retrieved", article));
    }

    @PostMapping("/api/admin/articles")
    public ResponseEntity<ApiResponse<Article>> createArticle(@Valid @RequestBody ArticleRequest request) {
        Article created = articleService.createArticle(request);
        return ResponseEntity.ok(ApiResponse.success("Article created", created));
    }

    @PutMapping("/api/admin/articles/{id}")
    public ResponseEntity<ApiResponse<Article>> updateArticle(@PathVariable Long id, @Valid @RequestBody ArticleRequest request) {
        Article updated = articleService.updateArticle(id, request);
        return ResponseEntity.ok(ApiResponse.success("Article updated", updated));
    }

    @DeleteMapping("/api/admin/articles/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteArticle(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return ResponseEntity.ok(ApiResponse.success("Article deleted"));
    }
}
