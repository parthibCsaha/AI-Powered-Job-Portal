package com.jobportal.jobportalapplication.controller;

import com.jobportal.jobportalapplication.dto.ApiResponse;
import com.jobportal.jobportalapplication.service.ResumeParserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Autowired
    private ResumeParserService resumeParserService;

    /**
     * Upload a file (resume, profile image, etc.)
     */
    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "resume") String type) {

        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Please select a file to upload"));
            }

            // Validate file type
            String originalFilename = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFilename);

            if (!isValidFileType(type, fileExtension)) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Invalid file type for " + type));
            }

            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir, type);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String newFilename = UUID.randomUUID().toString() + "." + fileExtension;
            Path filePath = uploadPath.resolve(newFilename);

            // Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return file URL
            String fileUrl = "/api/files/download/" + type + "/" + newFilename;

            Map<String, String> response = new HashMap<>();
            response.put("fileUrl", fileUrl);
            response.put("fileName", originalFilename);
            response.put("fileType", file.getContentType());

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body(new ApiResponse(false, "Failed to upload file: " + e.getMessage()));
        }
    }

    /**
     * Download/view a file
     */
    @GetMapping("/download/{type}/{filename}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String type,
            @PathVariable String filename) {

        try {
            Path filePath = Paths.get(uploadDir, type).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            // Determine content type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Delete a file
     */
    @DeleteMapping("/delete/{type}/{filename}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteFile(
            @PathVariable String type,
            @PathVariable String filename) {

        try {
            Path filePath = Paths.get(uploadDir, type).resolve(filename).normalize();

            if (Files.exists(filePath)) {
                Files.delete(filePath);
                return ResponseEntity.ok(new ApiResponse(true, "File deleted successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body(new ApiResponse(false, "Failed to delete file: " + e.getMessage()));
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    private boolean isValidFileType(String type, String extension) {
        return switch (type.toLowerCase()) {
            case "resume" -> extension.matches("pdf|doc|docx|txt");
            case "image", "profile" -> extension.matches("jpg|jpeg|png|gif|webp");
            case "document" -> extension.matches("pdf|doc|docx|txt|xls|xlsx");
            default -> true;
        };
    }

    /**
     * Upload resume and extract text for AI analysis
     * Returns both the file URL and extracted text
     */
    @PostMapping("/upload-resume")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadResumeWithExtraction(
            @RequestParam("file") MultipartFile file) {

        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Please select a file to upload"));
            }

            String originalFilename = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFilename);

            // Validate resume file type
            if (!fileExtension.matches("pdf|doc|docx|txt")) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Invalid file type. Please upload PDF, DOC, DOCX, or TXT"));
            }

            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir, "resume");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String newFilename = UUID.randomUUID().toString() + "." + fileExtension;
            Path filePath = uploadPath.resolve(newFilename);

            // Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Extract text from resume
            String extractedText = resumeParserService.extractText(file);

            // Return file URL and extracted text
            String fileUrl = "/api/files/download/resume/" + newFilename;

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("fileUrl", fileUrl);
            response.put("fileName", originalFilename);
            response.put("fileType", file.getContentType());
            response.put("extractedText", extractedText);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new ApiResponse(false, "Failed to process resume: " + e.getMessage()));
        }
    }
}

