import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { getSupabase } from "../lib/supabase";

interface WineItem {
  slug: string;
  name: string;
  emoji: string;
}

interface WineSearchPickerProps {
  selected: WineItem[];
  onChange: (wines: WineItem[]) => void;
  maxItems?: number;
}

export default function WineSearchPicker({
  selected,
  onChange,
  maxItems = 10,
}: WineSearchPickerProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language.startsWith("zh");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WineItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchWines = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setSearching(true);
      const sb = getSupabase();
      if (sb) {
        const { data } = await sb
          .from("wines")
          .select("slug, name, emoji")
          .or(`name.ilike.%${q}%,grape_variety.ilike.%${q}%`)
          .limit(8);
        if (data) {
          setResults(
            data
              .filter(
                (w: WineItem) => !selected.some((s) => s.slug === w.slug)
              )
              .map((w: WineItem) => ({
                slug: w.slug,
                name: w.name,
                emoji: w.emoji || "🍷",
              }))
          );
        }
      }
      setSearching(false);
      setShowResults(true);
    },
    [selected]
  );

  const handleChangeText = (text: string) => {
    setQuery(text);
    // Simple debounce via timeout
    const timer = setTimeout(() => searchWines(text), 300);
    return () => clearTimeout(timer);
  };

  const handleSelect = (wine: WineItem) => {
    if (selected.length >= maxItems) return;
    onChange([...selected, wine]);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const handleRemove = (slug: string) => {
    onChange(selected.filter((w) => w.slug !== slug));
  };

  return (
    <View style={styles.container}>
      {/* Selected tags */}
      {selected.length > 0 && (
        <View style={styles.tags}>
          {selected.map((w) => (
            <View key={w.slug} style={styles.tag}>
              <Text style={styles.tagEmoji}>{w.emoji}</Text>
              <Text style={styles.tagText} numberOfLines={1}>
                {w.name}
              </Text>
              <Pressable onPress={() => handleRemove(w.slug)} hitSlop={6}>
                <Text style={styles.tagRemove}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Search input */}
      {selected.length < maxItems && (
        <View>
          <TextInput
            style={styles.input}
            placeholder={
              isZh ? "搜索酒款名稱..." : "Search wine name..."
            }
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={handleChangeText}
            autoCapitalize="none"
          />
          {searching && (
            <ActivityIndicator
              size="small"
              color="#5B2E35"
              style={styles.spinner}
            />
          )}
        </View>
      )}

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.slug}
            renderItem={({ item }) => (
              <Pressable
                style={styles.resultRow}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.resultEmoji}>{item.emoji}</Text>
                <Text style={styles.resultName} numberOfLines={1}>
                  {item.name}
                </Text>
              </Pressable>
            )}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F0EB",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
    maxWidth: "100%",
  },
  tagEmoji: { fontSize: 14 },
  tagText: {
    fontSize: 13,
    color: "#2C2C2C",
    flexShrink: 1,
  },
  tagRemove: {
    fontSize: 12,
    color: "#6B6560",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#2C2C2C",
  },
  spinner: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 200,
    overflow: "hidden",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F0EB",
  },
  resultEmoji: { fontSize: 18, marginRight: 10 },
  resultName: { fontSize: 14, color: "#2C2C2C", flex: 1 },
});
