import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
} from "react-native";
import { useTranslation } from "react-i18next";

const PRESET_TAGS_ZH = [
  "紅酒", "白酒", "氣泡酒", "甜酒", "日常", "送禮",
  "配餐", "聚餐", "約會", "入門", "性價比", "收藏級",
];

const PRESET_TAGS_EN = [
  "Red", "White", "Sparkling", "Dessert", "Everyday", "Gift",
  "Food Pairing", "Dinner", "Date Night", "Beginner", "Value", "Premium",
];

interface TagInputProps {
  selected: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

export default function TagInput({
  selected,
  onChange,
  maxTags = 5,
}: TagInputProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language.startsWith("zh");
  const presets = isZh ? PRESET_TAGS_ZH : PRESET_TAGS_EN;

  const [customInput, setCustomInput] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || selected.length >= maxTags) return;
    if (selected.includes(trimmed)) return;
    onChange([...selected, trimmed]);
  };

  const removeTag = (tag: string) => {
    onChange(selected.filter((t) => t !== tag));
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      addTag(customInput.trim());
      setCustomInput("");
    }
  };

  const availablePresets = presets.filter((t) => !selected.includes(t));

  return (
    <View style={styles.container}>
      {/* Selected tags */}
      {selected.length > 0 && (
        <View style={styles.selectedRow}>
          {selected.map((tag) => (
            <View key={tag} style={styles.selectedTag}>
              <Text style={styles.selectedTagText}>{tag}</Text>
              <Pressable onPress={() => removeTag(tag)} hitSlop={6}>
                <Text style={styles.selectedTagRemove}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Custom input */}
      {selected.length < maxTags && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={isZh ? "自訂標籤..." : "Custom tag..."}
            placeholderTextColor="#9CA3AF"
            value={customInput}
            onChangeText={setCustomInput}
            onSubmitEditing={handleCustomSubmit}
            returnKeyType="done"
            maxLength={20}
          />
          {customInput.trim() ? (
            <Pressable style={styles.addBtn} onPress={handleCustomSubmit}>
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {/* Preset suggestions */}
      {selected.length < maxTags && availablePresets.length > 0 && (
        <View style={styles.presets}>
          {availablePresets.slice(0, 8).map((tag) => (
            <Pressable
              key={tag}
              style={styles.presetTag}
              onPress={() => addTag(tag)}
            >
              <Text style={styles.presetTagText}>{tag}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.hint}>
        {selected.length}/{maxTags}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  selectedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5B2E35",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  selectedTagText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  selectedTagRemove: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#2C2C2C",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#5B2E35",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginTop: -2,
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  presetTag: {
    backgroundColor: "#F3F0EB",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  presetTagText: {
    fontSize: 13,
    color: "#6B6560",
  },
  hint: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 4,
  },
});
