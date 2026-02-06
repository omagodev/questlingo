import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { StorySegment } from "../types";
import { COLORS, FONTS } from "../theme";
import { X, Book } from "lucide-react-native";

interface JournalProps {
  history: StorySegment[];
  onClose: () => void;
}

const Journal: React.FC<JournalProps> = ({ history, onClose }) => {
  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Book size={24} color={COLORS.warning} />
              <Text style={styles.title}>DIÁRIO DA AVENTURA</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {history.length === 0 ? (
              <Text style={styles.emptyText}>
                Sua história está apenas começando...
              </Text>
            ) : (
              history.map((segment, idx) => (
                <View key={idx} style={styles.journalItem}>
                  <View style={styles.timeline}>
                    <View style={styles.dot} />
                    <View style={styles.line} />
                  </View>
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.chapterNum}>CAPÍTULO {idx + 1}</Text>
                    </View>
                    <Text style={styles.storyText}>{segment.content}</Text>
                    <View style={styles.translationBox}>
                      <Text style={styles.translationText}>
                        {segment.translation}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    padding: 16,
  },
  content: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    height: "85%",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: COLORS.warning,
    fontFamily: FONTS.retro,
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  emptyText: {
    color: COLORS.text,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 40,
  },
  journalItem: {
    flexDirection: "row",
    gap: 12,
  },
  timeline: {
    alignItems: "center",
    width: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.warning,
    borderWidth: 2,
    borderColor: COLORS.dark,
    zIndex: 1,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
    marginVertical: -2,
  },
  itemContent: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    marginBottom: 8,
  },
  chapterNum: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONTS.retro,
  },
  storyText: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  translationBox: {
    borderLeftWidth: 2,
    borderLeftColor: "rgba(122, 162, 247, 0.3)",
    paddingLeft: 10,
  },
  translationText: {
    color: COLORS.text,
    fontSize: 12,
    fontStyle: "italic",
  },
});

export default Journal;
