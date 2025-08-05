import React, { useEffect, useState } from "react";
import axios from "axios";
import missingImage from "../assets/missing.png";
import { get, set } from "idb-keyval";
import "../index.css";

const MainPage = () => {
  const [books, setBooks] = useState([]);
  const [cachedImages, setCachedImages] = useState({});

  const fetchAndCacheImage = async (cover_i, url) => {
    try {
      if (cachedImages[cover_i]) return cachedImages[cover_i];

      const cachedBlob = await get(cover_i);
      if (cachedBlob) {
        const blobUrl = URL.createObjectURL(cachedBlob);
        setCachedImages((prev) => ({ ...prev, [cover_i]: blobUrl }));
        return blobUrl;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Image fetch failed");
      const blob = await response.blob();
      await set(cover_i, blob);

      const blobUrl = URL.createObjectURL(blob);
      setCachedImages((prev) => ({ ...prev, [cover_i]: blobUrl }));
      return blobUrl;
    } catch (error) {
      console.error("Image caching error:", error);
      return null;
    }
  };

  const getCoverUrl = (cover_i) =>
    `https://covers.openlibrary.org/b/id/${cover_i}-M.jpg`;

  useEffect(() => {
    let isMounted = true;

    const fetchBooks = () => {
      axios
        .get("http://localhost:8080/list")
        .then((response) => {
          if (isMounted) setBooks(response.data);
        })
        .catch((error) => {
          console.error("Error fetching books:", error);
        });
    };

    fetchBooks();
    const intervalId = setInterval(fetchBooks, 30000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    books.forEach((book) => {
      const coverId = book.cover_i;
      if (coverId && !cachedImages[coverId]) {
        fetchAndCacheImage(coverId, getCoverUrl(coverId));
      }
    });
  }, [books]);

  return (
    <div
      style={{
        // padding: "1rem",
        fontFamily: "Calibri",
        backgroundColor: "#2E1A00",
        minHeight: "100vh",
        color: "#FFB347",
        marginTop: "5rem",
      }}
    >
      <h1 style={{ marginBottom: "5rem" }}>Library Shits</h1>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.5rem",
          justifyContent: "center",
        }}
      >
        {books.map((book) => {
          const coverId = book.cover_i;
          const imageSrc =
            coverId && cachedImages[coverId]
              ? cachedImages[coverId]
              : missingImage;

          return (
            <div
              key={book.id}
              style={{ textAlign: "center" }}
              onClick={() => {
                if (book.key) {
                  window.open(`https://openlibrary.org${book.key}`, "_blank");
                }
              }}
            >
              <div className="book-container">
                <div className="book">
                  <div>
                    <img
                      src={imageSrc}
                      alt="cover"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "0 2px 2px 0",
                      }}
                    />
                  </div>
                </div>
              </div>

              <h3
                style={{
                  color: "#FFB347",
                  margin: "0.5rem 0 0.2rem",
                  textAlign: "right",
                  paddingRight: "2.5rem",
                }}
              >
                {book.title}
              </h3>
              <p
                style={{
                  color: "#FFF1C1",
                  fontSize: "0.9rem",
                  textAlign: "right",
                  paddingRight: "2.5rem",
                  marginBottom: "2rem",
                }}
              >
                {book.author_name?.join(", ") || "Unknown"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MainPage;
