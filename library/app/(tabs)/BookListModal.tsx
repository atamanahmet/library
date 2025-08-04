// BookListModal.tsx
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type Book = {
  author_key: string[];
  author_name: string[];
  ebook_access: string;
  edition_count: number;
  first_publish_year: number;
  has_fulltext: boolean;
  key: string;
  language: string[];
  public_scan_b: boolean;
  title: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  books: Book[];
};

export default function BookListModal({ visible, onClose, books }: Props) {
  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Books Found</Text>
          <ScrollView style={styles.bookList}>
            {books.map((book, index) => (
              <View key={index} style={styles.bookItem}>
                <Text style={styles.title}>{book.title}</Text>
                <Text style={styles.author}>
                  {book.author_name?.join(", ") || "Unknown Author"}
                </Text>
                <Text style={styles.meta}>
                  {book.first_publish_year} • {book.language?.join(", ")}
                </Text>
              </View>
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
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  bookList: {
    marginBottom: 12,
  },
  bookItem: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  author: {
    color: "#444",
  },
  meta: {
    color: "#666",
    fontSize: 12,
  },
  closeButton: {
    alignSelf: "center",
    marginTop: 8,
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 6,
  },
  closeText: {
    fontWeight: "bold",
  },
});
