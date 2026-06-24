package com.kedipin.service.impl;

import com.kedipin.dto.ArticleRequest;
import com.kedipin.entity.Article;
import com.kedipin.exception.ResourceNotFoundException;
import com.kedipin.repository.ArticleRepository;
import com.kedipin.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ArticleServiceImpl implements ArticleService {

    private final ArticleRepository articleRepository;

    @Override
    public List<Article> getAllArticles(boolean onlyPublished) {
        if (onlyPublished) {
            return articleRepository.findByIsPublishedTrueOrderByCreatedAtDesc();
        }
        return articleRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public Article getArticleById(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found with id: " + id));

        // Increment view count
        article.setViewCount(article.getViewCount() + 1);
        return articleRepository.save(article);
    }

    @Override
    public Article createArticle(ArticleRequest request) {
        Article article = Article.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .thumbnail(request.getExcerpt()) // Store excerpt in thumbnail column
                .author(request.getAuthorId())
                .isPublished(request.isPublished())
                .viewCount(0)
                .build();
        return articleRepository.save(article);
    }

    @Override
    public Article updateArticle(Long id, ArticleRequest request) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found with id: " + id));

        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setCategory(request.getCategory());
        article.setThumbnail(request.getExcerpt());
        article.setAuthor(request.getAuthorId());
        article.setIsPublished(request.isPublished());

        return articleRepository.save(article);
    }

    @Override
    public void deleteArticle(Long id) {
        if (!articleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Article not found with id: " + id);
        }
        articleRepository.deleteById(id);
    }
}
