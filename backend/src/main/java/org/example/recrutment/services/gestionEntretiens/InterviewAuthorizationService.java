package org.example.recrutment.services.gestionEntretiens;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.example.recrutment.entities.users.UserRole;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.repositories.gestionEntretiens.InterviewRepository;
import org.example.recrutment.repositories.users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InterviewAuthorizationService {
    private final InterviewRepository interviewRepository;
    private final UserRepository userRepository;

    public Users userByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    public Interview requireViewAccess(Users user, Long interviewId) {
        Interview interview = findInterview(interviewId);
        if (user.getUserRole() == UserRole.ADMIN || user.getUserRole() == UserRole.HR
                || isCandidate(user, interview) || isAssignedEvaluator(user, interview)) return interview;
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized for this interview");
    }

    public Interview requireMediaParticipant(Users user, Long interviewId) {
        Interview interview = findInterview(interviewId);
        if (isCandidate(user, interview) || isAssignedEvaluator(user, interview)) return interview;
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not an assigned interview participant");
    }

    public Interview requireMediaParticipantByEmail(String email, Long interviewId) {
        return requireMediaParticipant(userByEmail(email), interviewId);
    }

    public Interview requireEvaluationAccess(Users user, Long interviewId) {
        Interview interview = findInterview(interviewId);
        if (user.getUserRole() == UserRole.ADMIN || isAssignedEvaluator(user, interview)) return interview;
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to evaluate this interview");
    }

    public boolean isCandidate(Users user, Interview interview) {
        return user.getUserRole() == UserRole.CANDIDATE
                && Objects.equals(interview.getApplication().getCandidate().getId(), user.getId());
    }

    public boolean isAssignedEvaluator(Users user, Interview interview) {
        return user.getUserRole() == UserRole.EVALUATOR && interview.getAssignedEvaluator() != null
                && Objects.equals(interview.getAssignedEvaluator().getId(), user.getId());
    }

    private Interview findInterview(Long id) {
        return interviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));
    }
}
