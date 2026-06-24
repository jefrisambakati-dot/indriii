package com.kedipin.service;

import com.kedipin.dto.ArticleRequest;
import com.kedipin.entity.Article;

import java.util.List;

public interface ArticleService {
    List<Article> getAllArticles(boolean onlyPublished);
    Article getArticleById(Long id);
    Article createArticle(ArticleRequest request);
    Article updateArticle(Long id, ArticleRequest request);
    void deleteArticle(Long id);
}
