package org.example.recrutment.services.users;

import org.example.recrutment.entities.users.Users;
import org.example.recrutment.repositories.users.UsersRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UsersServiceImpl implements UsersService {

    private final UsersRepository usersRepository;

    public UsersServiceImpl(UsersRepository usersRepository) {
        this.usersRepository = usersRepository;
    }

    @Override
    public Users create(Users users) {
        users.setId(null);
        return usersRepository.save(users);
    }

    @Override
    public Users update(Long id, Users users) {
        Users existing = getById(id);
        existing.setFirstName(users.getFirstName());
        existing.setLastName(users.getLastName());
        existing.setEmail(users.getEmail());
        existing.setPassword(users.getPassword());
        existing.setPhone(users.getPhone());
        existing.setUserRole(users.getUserRole());
        existing.setStatus(users.getStatus());
        return usersRepository.save(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public Users getById(Long id) {
        return usersRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Users> getAll() {
        return usersRepository.findAll();
    }

    @Override
    public void delete(Long id) {
        usersRepository.delete(getById(id));
    }
}
