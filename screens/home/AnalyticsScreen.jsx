import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BarChart, PieChart, LineChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import AnimatedView from "../../components/AnimatedView";
import LoadingSpinner from "../../components/LoadingSpinner";
const ACCENT = "#6C63FF";
const ACCENT2 = "#43C6AC";
const screenWidth = Dimensions.get("window").width;

const DEMO_DATA = {
  bar: {
    labels: ["Trip", "Rent", "Dining", "Office", "Gym"],
    datasets: [{ data: [4500, 12000, 3200, 5800, 2100] }],
  },
  pie: [
    {
      name: "Rent",
      population: 12000,
      color: "#6C63FF",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Trip",
      population: 4500,
      color: "#43C6AC",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Dining",
      population: 3200,
      color: "#FF6B6B",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Office",
      population: 5800,
      color: "#FFB347",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Gym",
      population: 2100,
      color: "#4158D0",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
  ],
};

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, groups: 0 });
  const insets = useSafeAreaInsets();

  const fetchStats = async () => {
    try {
      const response = await groupService.getUserGroups();
      const groups = response.data;
      const total = groups.reduce((acc, g) => acc + (g.totalExpense || 0), 0);
      setStats({ total, groups: groups.length });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: "6", strokeWidth: "2", stroke: "#ffa726" },
  };

  if (loading && !refreshing) {
    return <LoadingSpinner message="Analyzing your finances..." />;
  }

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ACCENT}
        translucent
      />

      <LinearGradient
        colors={[ACCENT, ACCENT2]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <AnimatedView entering={FadeInDown.duration(400)}>
          <Text style={styles.headerLabel}>Financial Overview</Text>
          <Text style={styles.headerTitle}>Analytics</Text>
        </AnimatedView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Real Stats Overview */}
        <AnimatedView
          entering={FadeInUp.duration(500).delay(100)}
          style={styles.summaryRow}
        >
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>
              ₹{stats.total.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Active Groups</Text>
            <Text style={styles.summaryValue}>{stats.groups}</Text>
          </View>
        </AnimatedView>

        {/* Demo Analytics Notice */}
        <View style={styles.demoBanner}>
          <Ionicons name="information-circle" size={18} color={ACCENT} />
          <Text style={styles.demoText}>
            Showing combined analytics with demo data
          </Text>
        </View>

        {/* Bar Chart Section */}
        <AnimatedView
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.chartCard}
        >
          <Text style={styles.chartTitle}>Spending by Category</Text>
          <BarChart
            data={DEMO_DATA.bar}
            width={screenWidth - 64}
            height={220}
            yAxisLabel="₹"
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
            showValuesOnTopOfBars
          />
        </AnimatedView>

        {/* Pie Chart Section */}
        <AnimatedView
          entering={FadeInDown.duration(600).delay(300)}
          style={styles.chartCard}
        >
          <Text style={styles.chartTitle}>Expense Distribution</Text>
          <PieChart
            data={DEMO_DATA.pie}
            width={screenWidth - 48}
            height={200}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        </AnimatedView>

        {/* Line Chart Section */}
        <AnimatedView
          entering={FadeInDown.duration(600).delay(400)}
          style={styles.chartCard}
        >
          <Text style={styles.chartTitle}>Monthly Spending Trend</Text>
          <LineChart
            data={{
              labels: ["Jan", "Feb", "Mar", "Apr", "May"],
              datasets: [{ data: [8000, 15000, 12000, 19000, 14000] }],
            }}
            width={screenWidth - 64}
            height={220}
            yAxisLabel="₹"
            chartConfig={{
              ...chartConfig,
              backgroundGradientFrom: "#6C63FF",
              backgroundGradientTo: "#43C6AC",
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            bezier
            style={styles.chart}
          />
        </AnimatedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: { color: "#FFF", fontSize: 32, fontWeight: "800", marginTop: 4 },
  scroll: { padding: 20 },
  summaryRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
    marginTop: -15,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  summaryLabel: {
    color: COLORS.gray,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  summaryValue: { color: "#1A1A2E", fontSize: 20, fontWeight: "800" },
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: ACCENT + "10",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  demoText: { color: ACCENT, fontSize: 13, fontWeight: "600" },
  chartCard: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 28,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 16,
  },
  chart: { marginVertical: 8, borderRadius: 16 },
});
