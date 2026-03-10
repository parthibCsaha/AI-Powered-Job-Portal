package com.jobportal.jobportalapplication.service;

import com.jobportal.jobportalapplication.entity.*;
import com.jobportal.jobportalapplication.repo.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private Application application;
    private Notification notification;

    @BeforeEach
    void setUp() {
        // Setup entities for notification creation
        User candidateUser = new User();
        candidateUser.setId(1L);
        candidateUser.setEmail("candidate@test.com");

        Candidate candidate = new Candidate();
        candidate.setId(1L);
        candidate.setUser(candidateUser);
        candidate.setFullName("John Doe");

        Company company = new Company();
        company.setId(1L);
        company.setName("TechCorp");

        User employerUser = new User();
        employerUser.setId(2L);
        employerUser.setEmail("employer@test.com");

        Employer employer = new Employer();
        employer.setId(1L);
        employer.setUser(employerUser);
        employer.setCompany(company);

        Job job = new Job();
        job.setId(1L);
        job.setTitle("Software Engineer");
        job.setCompany(company);
        job.setEmployer(employer);

        application = new Application();
        application.setId(1L);
        application.setJob(job);
        application.setCandidate(candidate);
        application.setStatus(ApplicationStatus.SHORTLISTED);

        // Setup a sample notification
        notification = new Notification();
        notification.setId(1L);
        notification.setUserId(2L);
        notification.setType("NEW_APPLICATION");
        notification.setMessage("New application received for Software Engineer from John Doe");
        notification.setIsRead(false);
        notification.setReferenceId(1L);
    }

    @Test
    @DisplayName("Notify new application creates correct notification")
    void testNotifyNewApplication() {
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        notificationService.notifyNewApplication(2L, application);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(2L);
        assertThat(saved.getType()).isEqualTo("NEW_APPLICATION");
        assertThat(saved.getMessage()).contains("Software Engineer");
        assertThat(saved.getMessage()).contains("John Doe");
        assertThat(saved.getReferenceId()).isEqualTo(1L);
        assertThat(saved.getIsRead()).isFalse();
    }

    @Test
    @DisplayName("Notify application status update creates correct notification")
    void testNotifyApplicationStatusUpdate() {
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        notificationService.notifyApplicationStatusUpdate(1L, application);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(1L);
        assertThat(saved.getType()).isEqualTo("APPLICATION_STATUS");
        assertThat(saved.getMessage()).contains("Software Engineer");
        assertThat(saved.getMessage()).contains("SHORTLISTED");
        assertThat(saved.getReferenceId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Get user notifications returns paginated results")
    void testGetUserNotifications() {
        PageRequest pageable = PageRequest.of(0, 10);
        Page<Notification> notifPage = new PageImpl<>(List.of(notification), pageable, 1);

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(2L, pageable))
                .thenReturn(notifPage);

        Page<Notification> result = notificationService.getUserNotifications(2L, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getMessage())
                .contains("Software Engineer");
    }

    @Test
    @DisplayName("Get unread notifications")
    void testGetUnreadNotifications() {
        when(notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(2L))
                .thenReturn(List.of(notification));

        List<Notification> result = notificationService.getUnreadNotifications(2L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getIsRead()).isFalse();
    }

    @Test
    @DisplayName("Get unread count")
    void testGetUnreadCount() {
        when(notificationRepository.countByUserIdAndIsReadFalse(2L)).thenReturn(5L);

        Long count = notificationService.getUnreadCount(2L);

        assertThat(count).isEqualTo(5L);
    }

    @Test
    @DisplayName("Mark notification as read")
    void testMarkAsRead() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        notificationService.markAsRead(1L);

        assertThat(notification.getIsRead()).isTrue();
        verify(notificationRepository).save(notification);
    }

    @Test
    @DisplayName("Mark notification as read throws exception when not found")
    void testMarkAsRead_NotFound() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsRead(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Notification not found");
    }

    @Test
    @DisplayName("Mark all notifications as read")
    void testMarkAllAsRead() {
        Notification notif1 = new Notification();
        notif1.setId(1L);
        notif1.setUserId(2L);
        notif1.setIsRead(false);
        notif1.setType("NEW_APPLICATION");
        notif1.setMessage("Test 1");

        Notification notif2 = new Notification();
        notif2.setId(2L);
        notif2.setUserId(2L);
        notif2.setIsRead(false);
        notif2.setType("NEW_APPLICATION");
        notif2.setMessage("Test 2");

        List<Notification> unread = new ArrayList<>(List.of(notif1, notif2));

        when(notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(2L))
                .thenReturn(unread);
        when(notificationRepository.saveAll(anyList())).thenReturn(unread);

        notificationService.markAllAsRead(2L);

        assertThat(notif1.getIsRead()).isTrue();
        assertThat(notif2.getIsRead()).isTrue();
        verify(notificationRepository).saveAll(unread);
    }

    @Test
    @DisplayName("Delete notification")
    void testDeleteNotification() {
        doNothing().when(notificationRepository).deleteById(1L);

        notificationService.deleteNotification(1L);

        verify(notificationRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Clear all notifications for user")
    void testClearAllNotifications() {
        doNothing().when(notificationRepository).deleteByUserId(2L);

        notificationService.clearAllNotifications(2L);

        verify(notificationRepository).deleteByUserId(2L);
    }
}
