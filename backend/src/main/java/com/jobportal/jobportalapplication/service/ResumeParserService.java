package com.jobportal.jobportalapplication.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
@Slf4j
public class ResumeParserService {

    /**
     * Extract text from uploaded resume file
     * Supports PDF, DOC, DOCX, and TXT files
     */
    public String extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("No file provided");
        }

        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new RuntimeException("Invalid file name");
        }

        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();

        try {
            return switch (extension) {
                case "pdf" -> extractFromPdf(file);
                case "docx" -> extractFromDocx(file);
                case "doc" -> extractFromDoc(file);
                case "txt" -> extractFromTxt(file);
                default -> throw new RuntimeException("Unsupported file format: " + extension);
            };
        } catch (Exception e) {
            log.error("Error extracting text from file: {}", filename, e);
            throw new RuntimeException("Failed to extract text from resume: " + e.getMessage());
        }
    }

    /**
     * Extract text from PDF file
     */
    private String extractFromPdf(MultipartFile file) throws Exception {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            return cleanText(text);
        }
    }

    /**
     * Extract text from DOCX file (Office 2007+)
     */
    private String extractFromDocx(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream();
             XWPFDocument document = new XWPFDocument(is)) {

            StringBuilder text = new StringBuilder();
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                text.append(paragraph.getText()).append("\n");
            }
            return cleanText(text.toString());
        }
    }

    /**
     * Extract text from DOC file (Office 97-2003)
     */
    private String extractFromDoc(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream();
             HWPFDocument document = new HWPFDocument(is);
             WordExtractor extractor = new WordExtractor(document)) {

            return cleanText(extractor.getText());
        }
    }

    /**
     * Extract text from TXT file
     */
    private String extractFromTxt(MultipartFile file) throws Exception {
        return cleanText(new String(file.getBytes()));
    }

    /**
     * Clean and normalize extracted text
     */
    private String cleanText(String text) {
        if (text == null) return "";

        // Remove excessive whitespace and normalize line breaks
        return text
                .replaceAll("\\r\\n", "\n")
                .replaceAll("\\r", "\n")
                .replaceAll("\\n{3,}", "\n\n")
                .replaceAll("[ \\t]{2,}", " ")
                .trim();
    }

    /**
     * Extract text from a file path
     * Used for extracting text from already uploaded files
     */
    public String extractTextFromPath(Path filePath) {
        if (filePath == null || !Files.exists(filePath)) {
            throw new RuntimeException("File not found");
        }

        String filename = filePath.getFileName().toString();
        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();

        try {
            byte[] fileBytes = Files.readAllBytes(filePath);

            return switch (extension) {
                case "pdf" -> extractPdfFromBytes(fileBytes);
                case "docx" -> extractDocxFromBytes(fileBytes);
                case "doc" -> extractDocFromBytes(fileBytes);
                case "txt" -> cleanText(new String(fileBytes));
                default -> throw new RuntimeException("Unsupported file format: " + extension);
            };
        } catch (Exception e) {
            log.error("Error extracting text from file: {}", filename, e);
            throw new RuntimeException("Failed to extract text from resume: " + e.getMessage());
        }
    }

    private String extractPdfFromBytes(byte[] bytes) throws Exception {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return cleanText(stripper.getText(document));
        }
    }

    private String extractDocxFromBytes(byte[] bytes) throws Exception {
        try (java.io.ByteArrayInputStream is = new java.io.ByteArrayInputStream(bytes);
             XWPFDocument document = new XWPFDocument(is)) {
            StringBuilder text = new StringBuilder();
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                text.append(paragraph.getText()).append("\n");
            }
            return cleanText(text.toString());
        }
    }

    private String extractDocFromBytes(byte[] bytes) throws Exception {
        try (java.io.ByteArrayInputStream is = new java.io.ByteArrayInputStream(bytes);
             HWPFDocument document = new HWPFDocument(is);
             WordExtractor extractor = new WordExtractor(document)) {
            return cleanText(extractor.getText());
        }
    }
}

