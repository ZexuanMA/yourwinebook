import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  FlatList,
  Dimensions,
  StatusBar,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export interface PreviewImage {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
}

interface ImagePreviewProps {
  images: PreviewImage[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

function ZoomableImage({ uri }: { uri: string }) {
  return (
    <ScrollView
      style={{ width: SCREEN_W, height: SCREEN_H }}
      contentContainerStyle={styles.zoomContainer}
      maximumZoomScale={3}
      minimumZoomScale={1}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      centerContent
      bouncesZoom
    >
      <Image
        source={{ uri }}
        style={styles.fullImage}
        resizeMode="contain"
      />
    </ScrollView>
  );
}

export default function ImagePreview({
  images,
  initialIndex = 0,
  visible,
  onClose,
}: ImagePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offset / SCREEN_W);
      if (idx >= 0 && idx < images.length) {
        setCurrentIndex(idx);
      }
    },
    [images.length],
  );

  const handleShow = useCallback(() => {
    setCurrentIndex(initialIndex);
    // Scroll to initial index after layout
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialIndex * SCREEN_W,
        animated: false,
      });
    }, 50);
  }, [initialIndex]);

  if (images.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.backdrop}>
        {/* Close button */}
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        {/* Image carousel */}
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          getItemLayout={(_, index) => ({
            length: SCREEN_W,
            offset: SCREEN_W * index,
            index,
          })}
          renderItem={({ item }) => <ZoomableImage uri={item.url} />}
        />

        {/* Page indicator */}
        {images.length > 1 && (
          <View style={styles.indicator}>
            <Text style={styles.indicatorText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  zoomContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  fullImage: {
    width: SCREEN_W,
    height: SCREEN_H * 0.75,
  },
  indicator: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  indicatorText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
});
