import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { COLORS } from "../utils/constants";

export default function GroupCard({ group, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Icon name="group" size={40} color={COLORS.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{group.name}</Text>
        <Text style={styles.members}>{group.members.length} members</Text>
      </View>
      <Icon name="chevron-right" size={24} color={COLORS.gray} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  members: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
});
