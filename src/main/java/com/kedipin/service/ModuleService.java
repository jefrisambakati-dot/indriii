package com.kedipin.service;

import com.kedipin.entity.Module;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

public interface ModuleService {
    Module uploadModule(String title, String description, String category, MultipartFile file) throws IOException;
    List<Module> getAllModules();
    Module getModuleById(Long id);
    void deleteModule(Long id) throws IOException;
}
