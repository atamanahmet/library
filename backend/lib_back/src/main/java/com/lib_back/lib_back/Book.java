package com.lib_back.lib_back;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Book {
    private List<String> author_key;
    private List<String> author_name;
    private String ebook_access;
    private int edition_count;
    private int first_publish_year;
    private boolean has_fulltext;
    private String key;
    private List<String> language;
    private boolean public_scan_b;
    private String title;
}