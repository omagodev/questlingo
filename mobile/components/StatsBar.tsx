import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { PlayerState } from "../types";
import { COLORS, FONTS } from "../theme";
import { Book, Save, Settings, Home, Heart, Flame } from "lucide-react-native";

interface StatsBarProps {
  player: PlayerState;
  onOpenJournal: () => void;
  onSaveGame: () => void;
  onOpenSettings: () => void;
  onExit: () => void;
}

const StatsBar: React.FC<StatsBarProps> = ({
  player,
  onOpenJournal,
  onSaveGame,
  onOpenSettings,
  onExit,
}) => {
  const xpProgress = Math.min(100, (player.xp / (player.level * 100)) * 100);

  return (
    <View style={styles.container}>
      {/* Player Info Section */}
      <View style={styles.playerSection}>
        <View style={styles.avatarContainer}>
          {player.avatarUrl ? (
            <Image source={{ uri: player.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{player.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{player.level}</Text>
          </View>
        </View>

        <View style={styles.xpSection}>
          <View style={styles.xpTextRow}>
            <Text style={styles.playerName} numberOfLines={1}>
              {player.name}
            </Text>
            <Text style={styles.xpValue}>
              XP {player.xp}/{player.level * 100}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${xpProgress}%` }]}
            />
          </View>
        </View>
      </View>

      {/* Stats and Actions Section */}
      <View style={styles.actionsSection}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Heart size={16} color={COLORS.danger} fill={COLORS.danger} />
            <Text style={styles.statText}>
              {player.health}/{player.maxHealth}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Flame size={16} color={COLORS.warning} fill={COLORS.warning} />
            <Text style={styles.statText}>{player.streak}</Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={onOpenJournal} style={styles.iconButton}>
            <Book size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSaveGame} style={styles.iconButton}>
            <Save size={20} color={COLORS.success} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onOpenSettings} style={styles.iconButton}>
            <Settings size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onExit} style={styles.iconButton}>
            <Home size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    paddingTop: 40, // For status bar area
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "column",
    gap: 12,
  },
  playerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.dark,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  avatarInitial: {
    color: COLORS.dark,
    fontWeight: "bold",
    fontSize: 18,
  },
  levelBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.dark,
    paddingHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelText: {
    color: COLORS.white,
    fontSize: 8,
    fontFamily: FONTS.retro,
  },
  xpSection: {
    flex: 1,
  },
  xpTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  playerName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  xpValue: {
    color: COLORS.text,
    fontSize: 10,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.dark,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.accent,
  },
  actionsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: COLORS.white,
    fontFamily: FONTS.retro,
    fontSize: 10,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
});

export default StatsBar;
