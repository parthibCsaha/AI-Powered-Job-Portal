package com.jobportal.jobportalapplication.service;

import com.jobportal.jobportalapplication.entity.Application;
import com.jobportal.jobportalapplication.entity.Notification;
import com.jobportal.jobportalapplication.repo.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public void notifyNewApplication(Long employerId, Application application) {
        Notification notification = new Notification();
        notification.setUserId(employerId);
        notification.setType("NEW_APPLICATION");
        notification.setMessage(String.format(
                "New application received for %s from %s",
                application.getJob().getTitle(),
                application.getCandidate().getFullName()
        ));
        notification.setReferenceId(application.getId());
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyApplicationStatusUpdate(Long candidateId, Application application) {
        Notification notification = new Notification();
        notification.setUserId(candidateId);
        notification.setType("APPLICATION_STATUS");
        notification.setMessage(String.format(
                "Your application for %s has been updated to: %s",
                application.getJob().getTitle(),
                application.getStatus()
        ));
        notification.setReferenceId(application.getId());
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }

    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unreadNotifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    @Transactional
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    @Transactional
    public void clearAllNotifications(Long userId) {
        notificationRepository.deleteByUserId(userId);
    }
}