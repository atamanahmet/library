
package com.lib_back.lib_back.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lib_back.lib_back.Book;
import com.lib_back.lib_back.User;
import com.lib_back.lib_back.Repository.BookRepository;
import com.lib_back.lib_back.Repository.UserRepository;

@Service
public class BookService {

    @Autowired
    BookRepository bookRepository;

    public void saveBook(Book book) {
        bookRepository.save(book);
    }

    public void deleteBook(Book book) {
        bookRepository.delete(book);
    }

    public Optional<Book> findById(Book book) {
        return bookRepository.findById(book.getId());
    }

    public List<Book> findByIdList(List<Long> idList) {
        return bookRepository.findAllById(idList);
    }
}
