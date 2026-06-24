package com.kedipin.controller;

import com.kedipin.dto.ApiResponse;
import com.kedipin.entity.Module;
import com.kedipin.service.ModuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
public class ModuleController {

    private final ModuleService moduleService;

    public ModuleController(ModuleService moduleService) {
        this.moduleService = moduleService;
    }

    @PostMapping("/api/admin/modules/upload")
    public ResponseEntity<ApiResponse<Module>> uploadModule(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam("file") MultipartFile file) throws IOException {
        Module module = moduleService.uploadModule(title, description, category, file);
        return ResponseEntity.ok(ApiResponse.success("Module uploaded successfully", module));
    }

    @GetMapping("/api/user/modules")
    public ResponseEntity<ApiResponse<List<Module>>> getAllModules() {
        List<Module> list = moduleService.getAllModules();
        return ResponseEntity.ok(ApiResponse.success("Modules retrieved", list));
    }

    @GetMapping("/api/user/modules/download/{id}")
    public ResponseEntity<Resource> downloadModule(@PathVariable Long id) throws IOException {
        Module module = moduleService.getModuleById(id);
        Path path = Paths.get(module.getFilePath());
        Resource resource = new UrlResource(path.toUri());

        if (resource.exists() || resource.isReadable()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + path.getFileName().toString() + "\"")
                    .body(resource);
        } else {
            throw new RuntimeException("Could not read file: " + module.getFilePath());
        }
    }

    @DeleteMapping("/api/admin/modules/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteModule(@PathVariable Long id) throws IOException {
        moduleService.deleteModule(id);
        return ResponseEntity.ok(ApiResponse.success("Module deleted successfully", null));
    }
}

