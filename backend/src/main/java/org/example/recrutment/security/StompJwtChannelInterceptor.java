package org.example.recrutment.security;

import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.users.UserStatus;
import org.example.recrutment.repositories.users.UserRepository;
import org.example.recrutment.services.gestionEntretiens.InterviewAuthorizationService;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class StompJwtChannelInterceptor implements ChannelInterceptor {
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final InterviewAuthorizationService interviewAuthorizationService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticate(accessor);
        } else if ((StompCommand.SUBSCRIBE.equals(accessor.getCommand())
                || StompCommand.SEND.equals(accessor.getCommand())) && accessor.getUser() == null) {
            throw new MessageDeliveryException("Authenticated STOMP session required");
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination == null || !destination.startsWith("/user/queue/")) {
                throw new MessageDeliveryException("Only private user subscriptions are allowed");
            }
            String prefix = "/user/queue/interviews/";
            if (destination.startsWith(prefix)) {
                try {
                    Long interviewId = Long.valueOf(destination.substring(prefix.length()));
                    interviewAuthorizationService.requireMediaParticipantByEmail(accessor.getUser().getName(), interviewId);
                } catch (NumberFormatException exception) {
                    throw new MessageDeliveryException("Invalid interview subscription");
                }
            }
        }
        return message;
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String authorization = accessor.getFirstNativeHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new MessageDeliveryException("Missing STOMP bearer token");
        }
        try {
            String email = jwtService.parse(authorization.substring(7)).getSubject();
            var user = userRepository.findByEmailIgnoreCase(email)
                    .filter(candidate -> candidate.getStatus() == UserStatus.ACTIVE)
                    .orElseThrow(() -> new MessageDeliveryException("WebSocket user is not active"));
            accessor.setUser(new UsernamePasswordAuthenticationToken(
                    user.getEmail(),
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getUserRole().name()))));
        } catch (JwtException | IllegalArgumentException exception) {
            throw new MessageDeliveryException("Invalid or expired STOMP token");
        }
    }
}
