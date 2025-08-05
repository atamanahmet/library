package com.lib_back.lib_back.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lib_back.lib_back.Book;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    Book findById(Book book);
}