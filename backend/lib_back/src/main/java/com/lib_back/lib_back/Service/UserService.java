package com.lib_back.lib_back.Service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lib_back.lib_back.User;
import com.lib_back.lib_back.Repository.UserRepository;

@Service
public class UserService {
    @Autowired
    UserRepository userRepository;

    public void saveUser(User user) {
        userRepository.save(user);
    }

    public void deleteUser(User user) {
        userRepository.delete(user);
    }

    public Optional<User> findUser(Long id) {
        return userRepository.findById(id);
    }
}
