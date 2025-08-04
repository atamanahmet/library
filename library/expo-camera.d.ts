import "expo-camera";

declare module "expo-camera" {
  interface CameraViewProps {
    onTextScanned?: (blocks: { value: string }[]) => void;
  }
}
