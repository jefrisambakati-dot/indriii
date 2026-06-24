package com.kedipin.service.impl;

import com.kedipin.entity.Module;
import com.kedipin.exception.BadRequestException;
import com.kedipin.exception.ResourceNotFoundException;
import com.kedipin.repository.ModuleRepository;
import com.kedipin.service.ModuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class ModuleServiceImpl implements ModuleService {

    private final ModuleRepository moduleRepository;

    public ModuleServiceImpl(ModuleRepository moduleRepository) {
        this.moduleRepository = moduleRepository;
    }

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public Module uploadModule(String title, String description, String category, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        // Ensure directories exist
        String targetDirStr = uploadDir + "/modules";
        Path targetDirPath = Paths.get(targetDirStr);
        if (!Files.exists(targetDirPath)) {
            Files.createDirectories(targetDirPath);
        }

        // Generate unique name to prevent collisions
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String generatedFilename = UUID.randomUUID().toString() + fileExtension;

        // Save file
        Path filePath = targetDirPath.resolve(generatedFilename);
        Files.copy(file.getInputStream(), filePath);

        // Save to Database
        Module module = Module.builder()
                .title(title)
                .description(description)
                .filePath(filePath.toAbsolutePath().toString().replace("\\", "/"))
                .category(category)
                .build();

        return moduleRepository.save(module);
    }

    @Override
    public List<Module> getAllModules() {
        return moduleRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public Module getModuleById(Long id) {
        return moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + id));
    }

    @Override
    public void deleteModule(Long id) throws IOException {
        Module module = getModuleById(id);
        // Delete physical file first
        if (module.getFilePath() != null) {
            Path filePath = Paths.get(module.getFilePath());
            Files.deleteIfExists(filePath);
        }
        // Remove DB record
        moduleRepository.deleteById(id);
    }
}
