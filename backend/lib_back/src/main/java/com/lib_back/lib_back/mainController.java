package com.lib_back.lib_back;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.awt.*;
import java.awt.image.BufferedImage;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lib_back.lib_back.Model.BooksResponse;
import com.lib_back.lib_back.Model.BooksResponse.BookItem;
import com.lib_back.lib_back.Model.BooksResponse.IndustryIdentifier;
import com.lib_back.lib_back.Service.BookService;
import com.lib_back.lib_back.Service.UserService;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
// import net.sourceforge.tess4j.*;

// import java.io.File;

@CrossOrigin(origins = "*")
@RestController
public class mainController {
    @Autowired
    BookService bookService;
    @Autowired
    UserService userService;

    @GetMapping("/")
    public ResponseEntity<String> mainPage() {
        System.out.println("Listening:8080");
        // getText();
        return new ResponseEntity<>("OK", HttpStatus.OK);

    }

    @GetMapping("/edited/{text}")
    public ResponseEntity<String> editedTextSearch(@PathVariable(name = "text", required = true) String text)
            throws URISyntaxException, IOException, InterruptedException {
        System.out.println("edited text: " + text);
        String payload = findBookInfo(text);
        return new ResponseEntity<>(payload, HttpStatus.OK);

    }

    @GetMapping("/list")
    public ResponseEntity<List<Book>> getList() {
        List<Book> bookList = new ArrayList<>();
        // for (Long id : userService.findUser(Long.valueOf(1)).get().getBookIds()) {
        // bookList.add(bookService.find())
        // }
        bookList = bookService.findByIdList(userService.findUser(Long.valueOf(1)).get().getBookIds());
        return new ResponseEntity<>(bookList, HttpStatus.OK);

    }

    @PostMapping("/selectedData")
    public ResponseEntity<String> getSelectedData(@RequestBody Book book) {
        if (book.getId() == null) {
            return ResponseEntity.badRequest().body("Book ID is required");
        }

        Optional<Book> optionalBook = bookService.findById(book);
        if (optionalBook.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Book not found");
        }

        Book findBook = optionalBook.get();

        Optional<User> optionalUser = userService.findUser(Long.valueOf(1));
        User user;
        if (optionalUser.isEmpty()) {
            user = new User();
            user.setUsername("asd");
            user.setPassword("asd");
            user.setBookIds(new ArrayList<>());
        } else {
            user = optionalUser.get();
        }

        user.getBookIds().add(findBook.getId());
        userService.saveUser(user);

        return ResponseEntity.ok("Book saved to user");
    }

    @PostMapping("/upload")
    public ResponseEntity<String> handleFileUpload(@RequestParam("file") MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            BufferedImage originalImage = ImageIO.read(in);

            BufferedImage resizedImage = resizeByWidth(originalImage, 1200);

            Tesseract tesseract = new Tesseract();

            tesseract.setDatapath("C:/Program Files/Tesseract-OCR/tessdata"); // Adjust as needed
            tesseract.setLanguage("eng");

            String result = tesseract.doOCR(resizedImage);
            System.out.println("before replace: " + result);
            result = result.replaceAll("[^a-zA-Z0-9]", " ");
            System.out.println("after replace: " + result);

            // System.out.println(result);

            saveImage(resizedImage, "jpg", "resized_output.jpg");
            System.out.println("Saved resized image to resized_output.jpg");

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("OCR error: " + e.getMessage());
        }
    }

    public String findBookInfo(String text)
            throws URISyntaxException, IOException, InterruptedException, JsonProcessingException {

        text = text.trim().replaceAll("\\s+", "+");

        String payload = "No data";

        HttpClient client = HttpClient.newHttpClient();

        if (!text.isEmpty()) {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI("https://openlibrary.org/search.json?q=" + text))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println(response.body());
            ObjectMapper mapper = new ObjectMapper();

            OpenLibResponse libResposne = mapper.readValue(response.body(), OpenLibResponse.class);

            for (Book book : libResposne.getDocs()) {
                System.out.println("Title: " + book.getTitle());
                System.out.println("Author: " + book.getAuthor_name());
                bookService.saveBook(book);
            }
            payload = mapper.writeValueAsString(libResposne.getDocs());

        }
        return payload;
    }

    public static BufferedImage resizeByWidth(BufferedImage originalImage, int targetWidth) {
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();
        int targetHeight = (targetWidth * originalHeight) / originalWidth;
        return resize(originalImage, targetWidth, targetHeight);
    }

    public static void saveImage(BufferedImage image, String format, String outputPath) throws IOException {
        File outputFile = new File(outputPath);
        ImageIO.write(image, format, outputFile);
    }

    public static BufferedImage resize(BufferedImage originalImage, int targetWidth, int targetHeight) {
        Image tmp = originalImage.getScaledInstance(targetWidth, targetHeight, Image.SCALE_SMOOTH);
        BufferedImage resized = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);

        Graphics2D g2d = resized.createGraphics();
        g2d.drawImage(tmp, 0, 0, null);
        g2d.dispose();

        return resized;
    }

    public static String getText() {
        File imageFile = new File("src/main/resources/sample.jpg");

        Tesseract tesseract = new Tesseract();

        tesseract.setDatapath("C:/Program Files/Tesseract-OCR/tessdata");
        tesseract.setLanguage("eng");
        String result = "not detected";
        try {
            // OCR processing
            result = tesseract.doOCR(imageFile);
            System.out.println("Extracted text:\n" + result);
        } catch (TesseractException e) {
            System.err.println("Error: " + e.getMessage());
        }
        return result;
    }

    public String extractOLIDFromInfoUrl(String infoUrl) {
        if (infoUrl == null || infoUrl.isEmpty()) {
            return null;
        }

        String[] parts = infoUrl.split("/");
        if (parts.length >= 5) {
            return parts[4];
        }

        return null;
    }

    @GetMapping("/isbn/{isbn}")
    public ResponseEntity<List<Book>> sendIsbn(@PathVariable String isbn)
            throws URISyntaxException, IOException, InterruptedException {
        System.out.println(isbn);

        if (isbn == null || isbn.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        HttpClient client = HttpClient.newHttpClient();
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // Step 1: Call the OpenLibrary ISBN API
        HttpRequest request = HttpRequest.newBuilder()
                .uri(new URI("https://openlibrary.org/api/books?bibkeys=ISBN:" + isbn + "&format=json&jscmd=data"))
                .header("User-Agent", "YourApp/1.0")
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        // System.out.println(response.body());
        JsonNode root = mapper.readTree(response.body());

        String isbnKey = "ISBN:" + isbn;
        if (!root.has(isbnKey)) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        // Step 2: Extract info_url and get OLID key
        JsonNode bookData = root.get(isbnKey);
        String infoUrl = bookData.has("info_url") ? bookData.get("info_url").asText() : null;

        if (infoUrl == null || !infoUrl.contains("/books/")) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        // Extract OLID from info_url
        String[] parts = infoUrl.split("/");
        if (parts.length < 5) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        String olidKey = parts[4]; // e.g. OL24390632M
        String bookDetailsUrl = "https://openlibrary.org/books/" + olidKey + ".json";

        // Step 3: Call /books/OLxxxx.json to get full details
        HttpRequest detailsRequest = HttpRequest.newBuilder()
                .uri(new URI(bookDetailsUrl))
                .header("User-Agent", "YourApp/1.0")
                .GET()
                .build();

        HttpResponse<String> detailsResponse = client.send(detailsRequest, HttpResponse.BodyHandlers.ofString());
        JsonNode detailsJson = mapper.readTree(detailsResponse.body());

        // Step 4: Create Book object
        Book book = new Book();

        // Title
        if (detailsJson.has("title")) {
            book.setTitle(detailsJson.get("title").asText());
        }

        // Authors
        if (detailsJson.has("authors")) {
            List<String> authorNames = new ArrayList<>();
            for (JsonNode author : detailsJson.get("authors")) {
                if (author.has("key")) {
                    // Fetch author name
                    String authorUrl = "https://openlibrary.org" + author.get("key").asText() + ".json";
                    HttpRequest authorRequest = HttpRequest.newBuilder()
                            .uri(new URI(authorUrl))
                            .header("User-Agent", "YourApp/1.0")
                            .GET()
                            .build();
                    HttpResponse<String> authorResponse = client.send(authorRequest,
                            HttpResponse.BodyHandlers.ofString());
                    JsonNode authorJson = mapper.readTree(authorResponse.body());
                    if (authorJson.has("name")) {
                        authorNames.add(authorJson.get("name").asText());
                    }
                }
            }
            book.setAuthor_name(authorNames);
        }

        // Cover ID
        if (detailsJson.has("covers") && detailsJson.get("covers").isArray()) {
            book.setCover_i(detailsJson.get("covers").get(0).asText());
        }

        // Book key
        if (detailsJson.has("key")) {
            book.setKey(detailsJson.get("key").asText());
        }

        // Publish date -> First publish year
        if (detailsJson.has("publish_date")) {
            String publishDate = detailsJson.get("publish_date").asText();
            try {
                book.setFirst_publish_year(Integer.parseInt(publishDate.replaceAll(".*?(\\d{4}).*", "$1")));
            } catch (Exception ignored) {
            }
        }

        // Language (optional)
        if (detailsJson.has("languages")) {
            List<String> langs = new ArrayList<>();
            for (JsonNode lang : detailsJson.get("languages")) {
                if (lang.has("key")) {
                    langs.add(lang.get("key").asText());
                }
            }
            book.setLanguage(langs);
        }

        // Return as list
        List<Book> books = new ArrayList<>();
        books.add(book);

        return ResponseEntity.ok(books);
    }
}
