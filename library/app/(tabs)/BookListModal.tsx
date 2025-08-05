import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type Book = {
  author_key?: string[];
  author_name?: string[];
  ebook_access?: string;
  edition_count?: number;
  first_publish_year?: number;
  has_fulltext?: boolean;
  key: string;
  language?: string[];
  public_scan_b?: boolean;
  title: string;
  cover_i?: number;
  id?: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  books: Book[];
};

const missingImage = require("../../assets/images/missing.png");

export default function BookListModal({ visible, onClose, books }: Props) {
  const handleSelect = async (book: Book) => {
    try {
      const res = await fetch("http://192.168.1.86:8080/selectedData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(book),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      Alert.alert("Book sent", `${book.title} sent to backend`);
    } catch (err: any) {
      console.error("Failed to send book:", err.message);
      Alert.alert("Error", "Failed to send book to backend.");
    }
  };

  const getCoverUrl = (cover_i?: number) =>
    cover_i ? `https://covers.openlibrary.org/b/id/${cover_i}-M.jpg` : null;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Books Found</Text>
          <ScrollView contentContainerStyle={styles.bookGrid}>
            {books.map((book, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => handleSelect(book)}
              >
                <Image
                  source={
                    book.cover_i
                      ? { uri: getCoverUrl(book.cover_i) }
                      : missingImage
                  }
                  style={styles.cover}
                />

                <Text style={styles.title}>{book.title}</Text>
                <Text style={styles.author}>
                  {book.author_name?.join(", ") || "Unknown"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#000a",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "95%",
    maxHeight: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  bookGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  card: {
    width: 100,
    marginBottom: 16,
    alignItems: "center",
  },
  cover: {
    width: 100,
    height: 150,
    borderRadius: 6,
    backgroundColor: "#eee",
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  author: {
    fontSize: 10,
    color: "#555",
    textAlign: "center",
  },
  closeButton: {
    alignSelf: "center",
    marginTop: 12,
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 6,
  },
  closeText: {
    fontWeight: "bold",
  },
});
