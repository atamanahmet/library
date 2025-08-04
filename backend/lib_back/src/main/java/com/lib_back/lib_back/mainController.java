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
import java.util.HashMap;
import java.awt.*;
import java.awt.image.BufferedImage;

import javax.imageio.ImageIO;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lib_back.lib_back.Model.BooksResponse;
import com.lib_back.lib_back.Model.BooksResponse.BookItem;
import com.lib_back.lib_back.Model.BooksResponse.IndustryIdentifier;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
// import net.sourceforge.tess4j.*;

// import java.io.File;

@CrossOrigin(origins = "*")
@RestController
public class mainController {
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
        findBookInfo(text);
        // getText();
        return new ResponseEntity<>("OK", HttpStatus.OK);

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

    public void findBookInfo(String text) throws URISyntaxException, IOException, InterruptedException {
        text = text.trim().replaceAll("\\s+", "+");

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
            }

        }
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

    @GetMapping("/isbn/{isbn}")
    public ResponseEntity<String> sendIsbn(@PathVariable(name = "isbn", required = true) String isbn)
            throws URISyntaxException, IOException, InterruptedException {

        System.out.println("isbn: " + isbn);

        HttpClient client = HttpClient.newHttpClient();

        if (!isbn.isEmpty()) {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI("https://www.googleapis.com/books/v1/volumes?q=isbn:" + isbn))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println(response.body());

            ObjectMapper mapper = new ObjectMapper();

            BooksResponse bookResponse = mapper.readValue(response.body(), BooksResponse.class);

            if (bookResponse.totalItems != 0) {
                for (BookItem item : bookResponse.items) {

                    System.out.println("Title: " + item.volumeInfo.title);
                    System.out.println("Author: " + item.volumeInfo.authors);
                    System.out.println("ISBNs: ");
                    for (IndustryIdentifier id : item.volumeInfo.industryIdentifiers) {
                        System.out.println("- " + id.type + ": " + id.identifier);
                    }
                    System.out.println("--------");
                }
            }
        }

        return new ResponseEntity<>(isbn + " received", HttpStatus.OK);
    }
}
