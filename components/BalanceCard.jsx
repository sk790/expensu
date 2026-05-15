import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../utils/constants';

export default function BalanceCard({ balance }) {
  const isPositive = balance.netBalance > 0;
  const isNegative = balance.netBalance < 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {balance.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{balance.name}</Text>
        </View>
        <Text style={[
          styles.netBalance,
          isPositive && styles.positive,
          isNegative && styles.negative
        ]}>
          {isPositive ? '+' : ''}{isNegative ? '-' : ''}₹{Math.abs(balance.netBalance).toFixed(2)}
        </Text>
      </View>

      {balance.owesTo.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Owes to:</Text>
          {balance.owesTo.map((debt) => (
            <View key={debt.userId} style={styles.debtRow}>
              <Text style={styles.debtName}>{debt.name}</Text>
              <Text style={styles.debtAmount}>₹{debt.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {balance.owedBy.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Owed by:</Text>
          {balance.owedBy.map((debt) => (
            <View key={debt.userId} style={styles.debtRow}>
              <Text style={styles.debtName}>{debt.name}</Text>
              <Text style={styles.debtAmount}>₹{debt.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    ...SHADOWS.soft,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gradientStart,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  netBalance: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  positive: {
    color: COLORS.success,
  },
  negative: {
    color: COLORS.danger,
  },
  section: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
  },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 5,
  },
  debtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingLeft: 10,
  },
  debtName: {
    fontSize: 14,
    color: COLORS.dark,
  },
  debtAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
});