import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Camera, CameraView } from "expo-camera";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import BookListModal, { Book } from "./BookListModal"; // Adjust path if needed

export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [barcodePermission, setBarcodePermission] = useState<boolean | null>(
    null
  );

  // Fixed camera ref type
  const cameraRef = useRef<CameraView | null>(null);

  const [uri, setUri] = useState<string | null>(null);
  const [mode, setMode] = useState<"picture" | "video">("picture");

  // Updated to use string literals for camera facing
  const [facing, setFacing] = useState<"front" | "back">("back");

  const [editableText, setEditableText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [searchMode, setSearchMode] = useState<"isbn" | "title" | null>(null);
  const [isbnScanned, setIsbnScanned] = useState(false);

  // Request permissions once
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      setBarcodePermission(status === "granted");
    })();
  }, []);

  // Reset scan flag when modal closes so you can scan again
  const onCloseModal = () => {
    setModalVisible(false);
    setIsbnScanned(false);
  };

  const takePicture = async () => {
    setEditableText("");
    setSearchText("");
    setError(null);

    if (!cameraRef.current) {
      setError("Camera not ready");
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      if (!photo.uri) {
        setError("Failed to capture photo");
        return;
      }
      setUri(photo.uri);

      // Only call OCR API if we're in title search mode
      if (searchMode === "title") {
        await uploadPhoto(photo.uri);
      }
    } catch (e: any) {
      setError("Error capturing or processing photo: " + e.message);
      console.error(e);
    }
  };

  const uploadPhoto = async (uri: string) => {
    setOcrLoading(true);
    setEditableText("");
    setSearchText("");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch("http://192.168.1.86:8080/upload", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const text = await response.text();
      setEditableText(text);
    } catch (e: any) {
      setError("Upload failed: " + e.message);
    } finally {
      setOcrLoading(false);
    }
  };

  // Properly typed barcode scan handler
  const handleISBNScanned = async ({ data }: { data: string }) => {
    if (isbnScanned) return;
    setIsbnScanned(true);
    setError(null);

    try {
      const response = await fetch(`http://192.168.1.86:8080/isbn/${data}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const json = await response.json();
      setBooks(json);
      setModalVisible(true);
    } catch (err: any) {
      setError("ISBN fetch failed: " + err.message);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "picture" ? "video" : "picture"));
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const renderCamera = () => (
    <View style={{ flex: 1, width: "100%" }}>
      {/* Mode select buttons */}
      <View style={styles.searchModeContainer}>
        <Pressable
          onPress={() => {
            setSearchMode("isbn");
            setUri(null);
            setEditableText("");
            setSearchText("");
            setError(null);
            setIsbnScanned(false);
          }}
          style={[
            styles.searchModeBtn,
            searchMode === "isbn" && styles.searchModeSelected,
          ]}
        >
          <Text style={styles.searchModeText}>ISBN</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setSearchMode("title");
            setUri(null);
            setEditableText("");
            setSearchText("");
            setError(null);
            setIsbnScanned(false);
          }}
          style={[
            styles.searchModeBtn,
            searchMode === "title" && styles.searchModeSelected,
          ]}
        >
          <Text style={styles.searchModeText}>Title</Text>
        </Pressable>
      </View>

      {/* ISBN live barcode scanner */}
      {searchMode === "isbn" && barcodePermission && (
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing={facing}
          onBarcodeScanned={handleISBNScanned}
        />
      )}

      {/* Title OCR camera (photo capture mode) */}
      {searchMode === "title" && (
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing={facing}
          ratio="16:9"
        >
          <View style={styles.shutterContainer}>
            <Pressable onPress={toggleMode}>
              {mode === "picture" ? (
                <AntDesign name="picture" size={32} color="white" />
              ) : (
                <Feather name="video" size={32} color="white" />
              )}
            </Pressable>

            <Pressable onPress={mode === "picture" ? takePicture : undefined}>
              {({ pressed }) => (
                <View
                  style={[styles.shutterBtn, { opacity: pressed ? 0.5 : 1 }]}
                >
                  <View
                    style={[
                      styles.shutterBtnInner,
                      { backgroundColor: mode === "picture" ? "white" : "red" },
                    ]}
                  />
                </View>
              )}
            </Pressable>

            <Pressable onPress={toggleFacing}>
              <FontAwesome6 name="rotate-left" size={32} color="white" />
            </Pressable>
          </View>
        </CameraView>
      )}
    </View>
  );

  const renderPicture = () => (
    <View style={styles.pictureContainer}>
      {uri && (
        <Image source={uri} contentFit="contain" style={styles.pictureImage} />
      )}
      <Button
        onPress={() => {
          setUri(null);
          setEditableText("");
          setSearchText("");
          setError(null);
        }}
        title="Take another picture"
      />
    </View>
  );

  const renderHighlightedText = () => {
    if (!searchText) {
      return <Text style={styles.detectedTextLine}>{editableText}</Text>;
    }

    const regex = new RegExp(
      `(${searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = editableText.split(regex);

    return (
      <Text style={styles.detectedTextLine}>
        {parts.map((part, i) =>
          part.toLowerCase() === searchText.toLowerCase() ? (
            <Text key={i} style={styles.highlightedText}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {!hasPermission && (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is required to use this app.
          </Text>
          <Button
            title="Grant Permission"
            onPress={async () => {
              const { status } = await Camera.requestCameraPermissionsAsync();
              setHasPermission(status === "granted");
              setBarcodePermission(status === "granted");
            }}
          />
        </View>
      )}

      {hasPermission && (uri ? renderPicture() : renderCamera())}

      <View style={styles.textBlocksContainer}>
        {ocrLoading && <ActivityIndicator size="large" color="#0f0" />}
        {!!error && <Text style={{ color: "red" }}>{error}</Text>}

        {searchMode === "title" && editableText.length > 0 && (
          <>
            <Text style={styles.detectedTextTitle}>
              Detected Text (editable):
            </Text>
            <TextInput
              multiline
              style={styles.editableTextInput}
              value={editableText}
              onChangeText={setEditableText}
              placeholder="Edit recognized text here"
              placeholderTextColor="#aaa"
            />

            <View style={styles.searchContainer}>
              <TextInput
                placeholder="Search text..."
                placeholderTextColor="#888"
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <Button title="Clear" onPress={() => setSearchText("")} />
            </View>

            <ScrollView style={{ maxHeight: 150 }}>
              {renderHighlightedText()}
            </ScrollView>

            <Button
              title="Clear Text"
              onPress={() => {
                setEditableText("");
                setSearchText("");
              }}
            />
            <View style={{ marginTop: 12 }}>
              <Button
                title="Send Edited Text to Backend"
                onPress={async () => {
                  try {
                    const encoded = encodeURIComponent(editableText);
                    const response = await fetch(
                      `http://192.168.1.86:8080/edited/${encoded}`
                    );
                    if (!response.ok) throw new Error(await response.text());
                    const json = await response.json();
                    setBooks(json);
                    setModalVisible(true);
                  } catch (err: any) {
                    setError("Send failed: " + err.message);
                  }
                }}
              />
            </View>
          </>
        )}
      </View>

      <BookListModal
        visible={modalVisible}
        onClose={onCloseModal}
        books={books}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  permissionText: { color: "white", textAlign: "center", marginBottom: 20 },
  pictureContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  pictureImage: { width: 300, aspectRatio: 1, marginBottom: 16 },
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    alignItems: "center",
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: { width: 70, height: 70, borderRadius: 50 },
  textBlocksContainer: {
    padding: 8,
    backgroundColor: "#0008",
    width: "90%",
    marginVertical: 12,
  },
  detectedTextTitle: { color: "white", fontWeight: "bold", marginBottom: 4 },
  editableTextInput: {
    color: "white",
    backgroundColor: "#222",
    padding: 10,
    borderRadius: 5,
    height: 150,
    marginBottom: 10,
    textAlignVertical: "top",
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#222",
    color: "white",
    paddingHorizontal: 10,
    borderRadius: 5,
    height: 40,
    marginRight: 8,
  },
  detectedTextLine: { color: "white", marginBottom: 2 },
  highlightedText: { backgroundColor: "yellow", color: "black" },
  searchModeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#111",
  },
  searchModeBtn: {
    width: 80,
    height: 40,
    marginHorizontal: 10,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
  searchModeSelected: { backgroundColor: "#00f" },
  searchModeText: { color: "white", fontWeight: "bold" },
});
