package org.example.recrutment.security;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.example.recrutment.entities.users.Users;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey key; private final long expirationMs;

    public JwtService(@Value("${security.jwt.secret}") String secret, @Value("${security.jwt.expiration-ms}") long expirationMs) {
        byte[] bytes = Decoders.BASE64.decode(secret);
        if (bytes.length < 32) throw new IllegalArgumentException("JWT_SECRET must contain at least 32 bytes");
        this.key = Keys.hmacShaKeyFor(bytes); this.expirationMs = expirationMs;
    }

    public String generateToken(Users user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(expirationMs);
        return Jwts.builder().subject(user.getEmail()).claim("userId", user.getId()).claim("role", user.getUserRole().name())
                .issuedAt(Date.from(now)).expiration(Date.from(expiresAt)).signWith(key).compact();
    }

    public Claims parse(String token) { return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload(); }
}
