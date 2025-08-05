package com.lib_back.lib_back;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ElementCollection
    @CollectionTable(name = "book_author_key", joinColumns = @JoinColumn(name = "book_id"))
    private List<String> author_key;
    @ElementCollection
    @CollectionTable(name = "book_author_name", joinColumns = @JoinColumn(name = "book_id"))
    private List<String> author_name;
    private String ebook_access;
    private int edition_count;
    private int first_publish_year;
    private boolean has_fulltext;

    private String key;
    @ElementCollection
    @CollectionTable(name = "book_language", joinColumns = @JoinColumn(name = "book_id"))
    private List<String> language;
    private boolean public_scan_b;
    private String title;
    private String cover_i;

    // @ManyToOne
    // @JoinColumn(name = "user_id")
    // private User user;
}