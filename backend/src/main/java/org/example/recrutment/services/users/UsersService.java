package org.example.recrutment.services.users;

import org.example.recrutment.entities.users.Users;

import java.util.List;

public interface UsersService {
    Users create(Users users);
    Users update(Long id, Users users);
    Users getById(Long id);
    List<Users> getAll();
    void delete(Long id);
}
