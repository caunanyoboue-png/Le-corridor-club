import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";

const COLORS = {
  cream: "#F3EAD6",
  ink: "#2C1C12",
  ocre: "#C65A21",
  vert: "#496532",
  amber: "#D5993C",
  sienna: "#A44C22",
};

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={COLORS.cream} />

      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🍺</Text>
        </View>
        <Text style={styles.title}>Le Corridor Club</Text>
        <Text style={styles.subtitle}>Maquis Manager</Text>
        <Text style={styles.tagline}>Bières · Porc braisé · Attiéké</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>Commander</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} activeOpacity={0.85}>
          <Text style={styles.btnSecondaryText}>Mes commandes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Application mobile — Sprint 1 (stub)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  hero: {
    alignItems: "center",
    gap: 12,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.ink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 42,
  },
  title: {
    fontFamily: "serif",
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.ink,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.ocre,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  tagline: {
    fontSize: 13,
    color: COLORS.ink + "80",
    marginTop: 4,
  },
  actions: {
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: COLORS.ocre,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.ocre,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnPrimaryText: {
    color: COLORS.cream,
    fontSize: 16,
    fontWeight: "700",
  },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: COLORS.sienna + "60",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  btnSecondaryText: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: COLORS.ink + "50",
  },
});
