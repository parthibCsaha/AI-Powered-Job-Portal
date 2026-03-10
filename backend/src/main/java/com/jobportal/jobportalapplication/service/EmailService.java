package com.jobportal.jobportalapplication.service;

import com.jobportal.jobportalapplication.entity.Application;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@jobportal.com}")
    private String fromEmail;

    @Value("${app.mail.enabled:false}")
    private boolean emailEnabled;

    @Async
    public void sendApplicationConfirmation(Application application) {
        try {
            String to = application.getCandidate().getUser().getEmail();
            String subject = "Application Submitted - " + application.getJob().getTitle();
            String body = String.format(
                    "Dear %s,\n\n" +
                            "Your application for %s at %s has been submitted successfully.\n\n" +
                            "Application ID: %d\n" +
                            "Applied on: %s\n\n" +
                            "We will review your application and get back to you soon.\n\n" +
                            "Best regards,\n" +
                            "AI Powered Job Portal Team",
                    application.getCandidate().getFullName(),
                    application.getJob().getTitle(),
                    application.getJob().getCompany().getName(),
                    application.getId(),
                    application.getAppliedDate());

            sendEmail(to, subject, body);
        } catch (Exception e) {
            log.error("Failed to send application confirmation email", e);
        }
    }

    @Async
    public void sendApplicationStatusUpdate(Application application) {
        try {
            String to = application.getCandidate().getUser().getEmail();
            String status = application.getStatus().toString();
            String subject = getStatusSubject(status, application.getJob().getTitle());
            String body = getStatusEmailBody(application, status);

            sendEmail(to, subject, body);
        } catch (Exception e) {
            log.error("Failed to send status update email", e);
        }
    }

    private String getStatusSubject(String status, String jobTitle) {
        return switch (status.toUpperCase()) {
            case "SHORTLISTED" -> "🎉 Congratulations! You've been Shortlisted - " + jobTitle;
            case "REJECTED" -> "Application Update - " + jobTitle;
            case "REVIEWED" -> "📋 Your Application is Under Review - " + jobTitle;
            case "ACCEPTED" -> "🎊 Congratulations! You're Hired - " + jobTitle;
            default -> "Application Status Update - " + jobTitle;
        };
    }

    private String getStatusEmailBody(Application application, String status) {
        String candidateName = application.getCandidate().getFullName();
        String jobTitle = application.getJob().getTitle();
        String companyName = application.getJob().getCompany().getName();

        return switch (status.toUpperCase()) {
            case "SHORTLISTED" -> String.format(
                    "Dear %s,\n\n" +
                            "Great news! We're pleased to inform you that your application for %s at %s has been SHORTLISTED.\n\n"
                            +
                            "The hiring team was impressed with your profile and would like to move forward with your application.\n\n"
                            +
                            "Next Steps:\n" +
                            "- You may be contacted for an interview soon\n" +
                            "- Please ensure your contact information is up to date\n" +
                            "- Keep an eye on your email for further updates\n\n" +
                            "Best of luck!\n\n" +
                            "Best regards,\n" +
                            "Job Portal Team",
                    candidateName, jobTitle, companyName);
            case "REJECTED" -> String.format(
                    "Dear %s,\n\n" +
                            "Thank you for your interest in the %s position at %s.\n\n" +
                            "After careful consideration, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our current needs.\n\n"
                            +
                            "We encourage you to:\n" +
                            "- Continue applying to other positions that match your skills\n" +
                            "- Update your profile to improve visibility\n" +
                            "- Check back for new job postings\n\n" +
                            "We wish you the best in your job search.\n\n" +
                            "Best regards,\n" +
                            "Job Portal Team",
                    candidateName, jobTitle, companyName);
            case "REVIEWED" -> String.format(
                    "Dear %s,\n\n" +
                            "Good news! Your application for the %s position at %s is currently being reviewed.\n\n" +
                            "The hiring team is evaluating your profile and qualifications. You will be notified of any updates.\n\n"
                            +
                            "In the meantime:\n" +
                            "- Ensure your profile is complete and up to date\n" +
                            "- Check your email regularly for updates\n\n" +
                            "Thank you for your patience!\n\n" +
                            "Best regards,\n" +
                            "Job Portal Team",
                    candidateName, jobTitle, companyName);
            case "ACCEPTED" -> String.format(
                    "Dear %s,\n\n" +
                            "🎊 CONGRATULATIONS! 🎊\n\n" +
                            "We are thrilled to inform you that you have been ACCEPTED for the %s position at %s!\n\n" +
                            "The employer will be in touch with you shortly regarding next steps, including:\n" +
                            "- Offer letter details\n" +
                            "- Start date\n" +
                            "- Onboarding information\n\n" +
                            "We're so happy to have played a part in your career journey.\n\n" +
                            "Congratulations once again!\n\n" +
                            "Best regards,\n" +
                            "Job Portal Team",
                    candidateName, jobTitle, companyName);
            default -> String.format(
                    "Dear %s,\n\n" +
                            "Your application status has been updated.\n\n" +
                            "Job: %s\n" +
                            "Company: %s\n" +
                            "New Status: %s\n\n" +
                            "Best regards,\n" +
                            "Job Portal Team",
                    candidateName, jobTitle, companyName, status);
        };
    }

    @Async
    public void sendNewApplicationAlert(Application application) {
        try {
            String to = application.getJob().getEmployer().getUser().getEmail();
            String subject = "New Application Received - " + application.getJob().getTitle();
            String body = String.format(
                    "Dear Employer,\n\n" +
                            "You have received a new application for %s.\n\n" +
                            "Candidate: %s\n" +
                            "Applied on: %s\n\n" +
                            "Please log in to review the application.\n\n" +
                            "Best regards,\n" +
                            "AI Powered Job Portal Team",
                    application.getJob().getTitle(),
                    application.getCandidate().getFullName(),
                    application.getAppliedDate());

            sendEmail(to, subject, body);
        } catch (Exception e) {
            log.error("Failed to send new application alert", e);
        }
    }

    private void sendEmail(String to, String subject, String body) {
        if (!emailEnabled || mailSender == null) {
            log.info("Email sending disabled. Would have sent to: {} with subject: {}", to, subject);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
        log.info("Email sent to: {}", to);
    }
}