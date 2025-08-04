package com.lib_back.lib_back.Model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class BooksResponse {
    public String kind;
    public int totalItems;
    public List<BookItem> items;

    public static class BookItem {
        public String kind;
        public String id;
        public String etag;
        public String selfLink;
        public VolumeInfo volumeInfo;
        public SaleInfo saleInfo;
        public AccessInfo accessInfo;
    }

    public static class VolumeInfo {
        public String title;
        public List<String> authors;
        public String publishedDate;
        public List<IndustryIdentifier> industryIdentifiers;
        public ReadingModes readingModes;
        public int pageCount;
        public String printType;
        public String maturityRating;
        public boolean allowAnonLogging;
        public String contentVersion;
        public PanelizationSummary panelizationSummary;
        public String language;
        public String previewLink;
        public String infoLink;
        public String canonicalVolumeLink;
    }

    public static class IndustryIdentifier {
        public String type;
        public String identifier;
    }

    public static class ReadingModes {
        public boolean text;
        public boolean image;
    }

    public static class PanelizationSummary {
        public boolean containsEpubBubbles;
        public boolean containsImageBubbles;
    }

    public static class SaleInfo {
        public String country;
        public String saleability;
        public boolean isEbook;
    }

    public static class AccessInfo {
        public String country;
        public String viewability;
        public boolean embeddable;
        public boolean publicDomain;
        public String textToSpeechPermission;
        public Epub epub;
        public Pdf pdf;
        public String webReaderLink;
        public String accessViewStatus;
        public boolean quoteSharingAllowed;
    }

    public static class Epub {
        public boolean isAvailable;
    }

    public static class Pdf {
        public boolean isAvailable;
    }
}
