import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { COLORS } from "../utils/constants";

export default function ExpenseCard({ expense, onPress }) {
  // console.log(expense,'ex');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.description}>{expense.description}</Text>
        <Text style={styles.amount}>₹{expense.amount}</Text>
      </View>
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Icon name="person" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>Paid by {expense.paidBy.name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="group" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>
            Split between {expense.splitBetween.length} people
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    flex: 1,
    marginRight: 10,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
    paddingTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 5,
  },
});
