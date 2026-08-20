package org.example.recrutment.auth;

import org.example.recrutment.entities.users.EmailVerificationToken;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.repositories.users.EmailVerificationTokenRepository;
import org.example.recrutment.repositories.users.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmailVerificationServiceTest {
    @Test
    void sendsVerificationCodeToCandidateEmailNotSenderEmail() {
        EmailVerificationTokenRepository tokens = mock(EmailVerificationTokenRepository.class);
        UserRepository users = mock(UserRepository.class);
        JavaMailSender mailSender = mock(JavaMailSender.class);
        EmailVerificationService service = new EmailVerificationService(tokens, users, mailSender);

        ReflectionTestUtils.setField(service, "expirationMinutes", 5L);
        ReflectionTestUtils.setField(service, "from", "recruitment.company@gmail.com");
        ReflectionTestUtils.setField(service, "mailUsername", "recruitment.company@gmail.com");
        when(tokens.findByUser_EmailIgnoreCaseAndUsedAtIsNull("candidate.test@gmail.com")).thenReturn(List.of());
        when(tokens.save(any(EmailVerificationToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Users user = Users.builder()
                .firstName("Candidate")
                .lastName("Test")
                .email("candidate.test@gmail.com")
                .build();

        service.sendVerificationEmail(user);

        var captor = org.mockito.ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage message = captor.getValue();
        assertThat(message.getFrom()).isEqualTo("recruitment.company@gmail.com");
        assertThat(message.getTo()).containsExactly("candidate.test@gmail.com");
        assertThat(message.getTo()).doesNotContain("recruitment.company@gmail.com");
        assertThat(message.getText()).containsPattern("\\b\\d{6}\\b");
    }
}
