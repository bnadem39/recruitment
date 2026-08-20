package org.example.recrutment.security;

import io.jsonwebtoken.Claims;
import org.example.recrutment.entities.users.UserRole;
import org.example.recrutment.entities.users.UserStatus;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.repositories.users.UserRepository;
import org.example.recrutment.services.gestionEntretiens.InterviewAuthorizationService;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;

import java.security.Principal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StompJwtChannelInterceptorTest {

    @Test
    void connectKeepsAuthenticatedPrincipalOnReturnedMessage() {
        JwtService jwtService = mock(JwtService.class);
        UserRepository userRepository = mock(UserRepository.class);
        InterviewAuthorizationService authorizationService = mock(InterviewAuthorizationService.class);
        Claims claims = mock(Claims.class);
        Users user = Users.builder()
                .email("eval@gmail.com")
                .userRole(UserRole.EVALUATOR)
                .status(UserStatus.ACTIVE)
                .build();

        when(jwtService.parse("valid-token")).thenReturn(claims);
        when(claims.getSubject()).thenReturn(user.getEmail());
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));

        StompHeaderAccessor headers = StompHeaderAccessor.create(StompCommand.CONNECT);
        headers.setNativeHeader("Authorization", "Bearer valid-token");
        headers.setLeaveMutable(true);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], headers.getMessageHeaders());

        Message<?> result = new StompJwtChannelInterceptor(jwtService, userRepository, authorizationService)
                .preSend(message, mock(org.springframework.messaging.MessageChannel.class));

        Principal principal = (Principal) result.getHeaders().get(SimpMessageHeaderAccessor.USER_HEADER);
        assertThat(principal).isNotNull();
        assertThat(principal.getName()).isEqualTo(user.getEmail());
    }
}
