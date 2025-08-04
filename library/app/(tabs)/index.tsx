import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { Image } from "expo-image";
import { useRef, useState } from "react";
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
import { Book } from "./BookListModal"; // adjust path if needed

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [mode, setMode] = useState<CameraMode>("picture");
  const [facing, setFacing] = useState<CameraType>("back");
  const [textBlocks, setTextBlocks] = useState<string[]>([]);
  const [editableText, setEditableText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    setTextBlocks([]);
    setEditableText("");
    setSearchText("");
    setError(null);

    try {
      const photo = await ref.current?.takePictureAsync({
        base64: false, // full res, no base64
        quality: 0.7,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        setError("Failed to capture photo");
        return;
      }

      setUri(photo.uri);
      await uploadPhoto(photo.uri);
    } catch (e: any) {
      setError("Error capturing or processing photo: " + e.message);
      console.error(e);
    }
  };

  const uploadPhoto = async (uri: string) => {
    setOcrLoading(true);
    setTextBlocks([]);
    setError(null);
    setEditableText("");
    setSearchText("");

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

      // Set editable text for editing/search
      setEditableText(text);

      const lines = text.split("\n").filter((line) => line.trim());
      setTextBlocks(lines);
    } catch (e: any) {
      setError("Upload failed: " + e.message);
    } finally {
      setOcrLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "picture" ? "video" : "picture"));
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const sendEditedText = async (text: string) => {
    try {
      const encodedText = encodeURIComponent(text);
      const response = await fetch(
        `http://192.168.1.86:8080/edited/${encodedText}`
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      const json = await response.json();
      setBooks(json); // assuming backend returns List<Book>
      setModalVisible(true);
    } catch (error: any) {
      console.error("Failed to send edited text:", error.message);
    }
  };

  const renderPicture = () => (
    <View style={styles.pictureContainer}>
      {uri && (
        <Image source={uri} contentFit="contain" style={styles.pictureImage} />
      )}
      <Button
        onPress={() => {
          setUri(null);
          setTextBlocks([]);
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

    const regex = new RegExp(`(${searchText})`, "gi");
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

  const renderCamera = () => (
    <View style={{ flex: 1, width: "100%" }}>
      <CameraView
        style={{ flex: 1, width: "100%" }}
        ref={ref}
        mode={mode}
        facing={facing}
        mute={false}
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
                style={[
                  styles.shutterBtn,
                  {
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
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
    </View>
  );

  return (
    <View style={styles.container}>
      {uri ? renderPicture() : renderCamera()}

      {/* OCR Text output */}
      <View style={styles.textBlocksContainer}>
        {ocrLoading && <ActivityIndicator size="large" color="#0f0" />}
        {!!error && <Text style={{ color: "red" }}>{error}</Text>}

        {editableText.length > 0 && (
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
                setTextBlocks([]);
                setEditableText("");
                setSearchText("");
              }}
            />
            <View style={{ marginTop: 12 }}>
              <Button
                title="Send Edited Text to Backend"
                onPress={() => sendEditedText(editableText)}
              />
            </View>
          </>
        )}
      </View>
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
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  textBlocksContainer: {
    padding: 8,
    backgroundColor: "#0008",
    width: "90%",
    marginVertical: 12,
  },
  detectedTextTitle: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 4,
  },
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
  detectedTextLine: {
    color: "white",
    marginBottom: 2,
  },
  highlightedText: {
    backgroundColor: "yellow",
    color: "black",
  },
});
