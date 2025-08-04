package com.lib_back.lib_back;

import net.sourceforge.tess4j.*;

import java.io.File;

public class img_to_text {
    public static void getText() {
        File imageFile = new File("src/main/resources/sample.png");

        // tesseract instance
        Tesseract tesseract = new Tesseract();

        // OPTIONAL: Set path to tessdata folder if not default
        // tesseract.setDatapath("C:/Program Files/Tesseract-OCR/tessdata");

        try {
            // OCR processing
            String result = tesseract.doOCR(imageFile);
            System.out.println("Extracted text:\n" + result);
        } catch (TesseractException e) {
            System.err.println("Error: " + e.getMessage());
        }
    }
}
