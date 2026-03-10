package com.jobportal.jobportalapplication.controller;

import com.jobportal.jobportalapplication.dto.ApiResponse;
import com.jobportal.jobportalapplication.entity.Notification;
import com.jobportal.jobportalapplication.security.UserDetailsImpl;
import com.jobportal.jobportalapplication.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getUserNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Pageable pageable = PageRequest.of(page, size);

        Page<Notification> notifications = notificationService.getUserNotifications(
                userDetails.getId(), pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notifications.getContent());
        response.put("currentPage", notifications.getNumber());
        response.put("totalItems", notifications.getTotalElements());
        response.put("totalPages", notifications.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadNotifications(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        List<Notification> unreadNotifications = notificationService.getUnreadNotifications(
                userDetails.getId());

        return ResponseEntity.ok(unreadNotifications);
    }

    @GetMapping("/unread/count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Long count = notificationService.getUnreadCount(userDetails.getId());

        Map<String, Long> response = new HashMap<>();
        response.put("count", count);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {

        notificationService.markAsRead(id);

        return ResponseEntity.ok(new ApiResponse(true, "Notification marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        notificationService.markAllAsRead(userDetails.getId());

        return ResponseEntity.ok(new ApiResponse(true, "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable Long id,
            Authentication authentication) {

        notificationService.deleteNotification(id);

        return ResponseEntity.ok(new ApiResponse(true, "Notification deleted"));
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<?> clearAllNotifications(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        notificationService.clearAllNotifications(userDetails.getId());

        return ResponseEntity.ok(new ApiResponse(true, "All notifications cleared"));
    }
}

