package com.restoran.repository;

import com.restoran.entity.Role;
import com.restoran.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByTelegramId(Long telegramId);
    List<User> findByRole(Role role);
    boolean existsByEmail(String email);
    boolean existsByTelegramId(Long telegramId);
}
