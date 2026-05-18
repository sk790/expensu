import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  ZoomIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import AnimatedView from "../../components/AnimatedView";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import { groupService, categoryService } from "../../services/authService";
import { COLORS, SHADOWS } from "../../utils/constants";

const { width } = Dimensions.get("window");

const CATEGORY_COLORS = [
  "#6C63FF", "#FF6584", "#43A047", "#FB8C00", "#00ACC1",
  "#8E24AA", "#E53935", "#1E88E5", "#F4511E", "#00897B",
];

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

const getCategoryColor = (str = "") => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
};

const getInitials = (name = "") => (name ? name.substring(0, 2).toUpperCase() : "?");

const formatExpenseDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCurrentMonthLabel = () => {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

export default function HistoryScreen() {
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthLabel());
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCurrency, setSelectedCurrency] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const currentUserId = currentUser?.id || currentUser?._id;

  const fetchAllHistory = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await groupService.getUserExpenses();
      if (res.success && res.data) {
        // Filter out settlement payments registered as expenses
        const filtered = res.data.filter(
          (exp) => exp.description !== "Settlement"
        );
        setExpenses(filtered);
      }

      // Fetch all system and custom categories
      const catRes = await categoryService.getCategories();
      if (catRes.success && catRes.data) {
        const items = catRes.data;
        // Reorder categories to place "Others" at index 0
        const othersIndex = items.findIndex(cat => cat.name === "Others");
        if (othersIndex > -1) {
          const othersCat = items.splice(othersIndex, 1)[0];
          items.unshift(othersCat);
        }
        setCategories(items);
      }
    } catch (error) {
      console.error("Failed to load user expenses history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllHistory(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchAllHistory(false);
  };

  // Get all unique months available in expenses for filter pills
  const availableMonths = useMemo(() => {
    const months = new Set();
    // Always include current month by default
    months.add(getCurrentMonthLabel());

    expenses.forEach((exp) => {
      if (!exp.createdAt) return;
      const date = new Date(exp.createdAt);
      const label = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      months.add(label);
    });
    return ["All", ...Array.from(months).sort((a, b) => new Date(b) - new Date(a))];
  }, [expenses]);

  // Get all unique categories available in expenses for filter pills
  const availableCategories = useMemo(() => {
    const cats = categories.map((cat) => cat.name);
    return ["All", ...cats];
  }, [categories]);

  // Get all unique currencies available in expenses dynamically
  const availableCurrencies = useMemo(() => {
    const currencies = new Set();
    expenses.forEach((exp) => {
      const curCode = exp.groupId?.currency || "INR";
      currencies.add(curCode);
    });
    return ["All", ...Array.from(currencies).sort()];
  }, [expenses]);

  // Handle fallback if currently selected month disappears from list after refresh
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth("All");
    }
  }, [availableMonths, selectedMonth]);

  // Handle fallback if currently selected category disappears from list after refresh
  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory("All");
    }
  }, [availableCategories, selectedCategory]);

  // Handle fallback if currently selected currency disappears from list after refresh
  useEffect(() => {
    if (availableCurrencies.length > 0 && !availableCurrencies.includes(selectedCurrency)) {
      setSelectedCurrency("All");
    }
  }, [availableCurrencies, selectedCurrency]);

  // Filtered expenses based on search query AND month filter AND category filter
  const filteredExpenses = useMemo(() => {
    let result = expenses;

    // 1. Month Filter
    if (selectedMonth !== "All") {
      result = result.filter((exp) => {
        if (!exp.createdAt) return false;
        const date = new Date(exp.createdAt);
        const label = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        return label === selectedMonth;
      });
    }

    // 1.5. Category Filter
    if (selectedCategory !== "All") {
      result = result.filter((exp) => {
        const catName = exp.category?.name || "Others";
        return catName === selectedCategory;
      });
    }

    // 1.7. Currency Filter
    if (selectedCurrency !== "All") {
      result = result.filter((exp) => {
        const curCode = exp.groupId?.currency || "INR";
        return curCode === selectedCurrency;
      });
    }

    // 2. Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (exp) =>
          exp.description.toLowerCase().includes(query) ||
          (exp.groupId?.name && exp.groupId.name.toLowerCase().includes(query))
      );
    }

    return result;
  }, [expenses, selectedMonth, selectedCategory, selectedCurrency, searchQuery]);

  // Group expenses month-wise
  const monthGroups = useMemo(() => {
    const groups = {};
    filteredExpenses.forEach((exp) => {
      if (!exp.createdAt) return;
      const date = new Date(exp.createdAt);
      const monthYear = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(exp);
    });

    // Sort months chronologically descending
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [filteredExpenses]);

  // Calculations for stats hero card
  const stats = useMemo(() => {
    let label = "";
    const currencyTotals = {};

    if (selectedMonth === "All" && selectedCategory === "All" && selectedCurrency === "All") {
      label = "All-Time Overview";
    } else {
      const monthLabel = selectedMonth === "All" ? "" : selectedMonth;
      const catLabel = selectedCategory === "All" ? "" : selectedCategory;
      const curLabel = selectedCurrency === "All" ? "" : selectedCurrency;
      label = `${monthLabel} ${catLabel} ${curLabel} Overview`.trim().replace(/\s+/g, " ");
    }

    filteredExpenses.forEach((exp) => {
      const curCode = exp.groupId?.currency || "INR";
      const perPerson = exp.amount / (exp.splitBetween?.length || 1);
      const isPaidByMe = exp.paidBy?._id === currentUserId;
      const isSplitWithMe = exp.splitBetween?.some((m) => m._id === currentUserId);

      if (!currencyTotals[curCode]) {
        currencyTotals[curCode] = { youPaid: 0, yourShare: 0 };
      }

      if (isPaidByMe) {
        currencyTotals[curCode].youPaid += exp.amount;
      }
      if (isSplitWithMe) {
        currencyTotals[curCode].yourShare += perPerson;
      }
    });

    return {
      label,
      currencyTotals,
    };
  }, [filteredExpenses, selectedMonth, selectedCategory, selectedCurrency, currentUserId]);

  const exportToPDF = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Compute currency overview HTML
      let currencyTotalsHtml = "";
      Object.keys(stats.currencyTotals).forEach((currencyCode) => {
        const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
        const item = stats.currencyTotals[currencyCode];
        currencyTotalsHtml += `
          <div style="margin-bottom: 12px; padding: 10px; background: #ffffff; border-radius: 8px; border: 1px dashed #E5E7EB;">
            <div style="font-size: 11px; font-weight: 800; color: #6C63FF; text-transform: uppercase; margin-bottom: 4px;">
              ${currencyCode} Summary
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #374151;">
              <div><strong>Your Net Share:</strong> ${symbol}${item.yourShare.toFixed(2)}</div>
              <div><strong>Total Paid By You:</strong> ${symbol}${item.youPaid.toFixed(2)}</div>
            </div>
          </div>
        `;
      });

      if (Object.keys(stats.currencyTotals).length === 0) {
        currencyTotalsHtml = "<p style='font-size: 13px; color: #6B7280;'>No splits or expenses found for this selection.</p>";
      }

      // Compute filtered list of transactions
      const expenseRowsHtml = filteredExpenses
        .map((expense) => {
          const dateStr = expense.createdAt
            ? new Date(expense.createdAt).toLocaleDateString("en-IN")
            : "N/A";
          const groupName = expense.groupId?.name || "Unknown Group";
          const categoryName = expense.category?.name || "Others";
          const description = expense.description || "";
          const paidByName = expense.paidBy?.name || "Unknown";
          const currencySymbol = CURRENCY_SYMBOLS[expense.groupId?.currency] || "₹";
          const totalAmount = `${currencySymbol}${Number(expense.amount).toFixed(2)}`;
          
          const isSplitWithMe = expense.splitBetween?.some((m) => m._id === currentUserId);
          const perPerson = expense.amount / (expense.splitBetween?.length || 1);
          const yourShare = isSplitWithMe
            ? `${currencySymbol}${perPerson.toFixed(2)}`
            : "Not in Split";

          return `
            <tr>
              <td>${dateStr}</td>
              <td>${groupName}</td>
              <td>${categoryName}</td>
              <td>${description}</td>
              <td>${paidByName}</td>
              <td>${totalAmount}</td>
              <td>${yourShare}</td>
            </tr>
          `;
        })
        .join("");

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Personal Expense History Report</title>
            <style>
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #111827;
                margin: 40px;
                line-height: 1.6;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #6C63FF;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .title-area h1 {
                margin: 0 0 6px 0;
                font-size: 26px;
                color: #6C63FF;
                font-weight: 800;
              }
              .title-area p {
                margin: 0;
                color: #6B7280;
                font-size: 13px;
              }
              .summary-section {
                background: #F9FAFB;
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 30px;
                border: 1px solid #E5E7EB;
              }
              .summary-section h3 {
                margin: 0 0 12px 0;
                font-size: 14px;
                color: #374151;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 40px;
              }
              th {
                background-color: #6C63FF;
                color: #ffffff;
                text-align: left;
                padding: 12px 14px;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.8px;
              }
              td {
                padding: 12px 14px;
                border-bottom: 1px solid #E5E7EB;
                font-size: 12px;
                color: #374151;
              }
              tr:nth-child(even) {
                background-color: #F9FAFB;
              }
              .footer {
                text-align: center;
                margin-top: 60px;
                font-size: 11px;
                color: #9CA3AF;
                border-top: 1px solid #E5E7EB;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title-area">
                <h1>Expense History Report</h1>
                <p>Personal Overview &bull; Generated on ${new Date().toLocaleDateString("en-IN")}</p>
              </div>
            </div>

            <div class="summary-section" style="margin-bottom: 30px;">
              <h3>Aggregated Splits Overview</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">
                ${currencyTotalsHtml}
              </div>
            </div>

            <h3 style="margin-bottom: 15px; font-size: 16px; color: #374151;">Transactions List</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Group</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Paid By</th>
                  <th>Amount</th>
                  <th>Your Share</th>
                </tr>
              </thead>
              <tbody>
                ${expenseRowsHtml || '<tr><td colspan="7" style="text-align: center;">No transactions found</td></tr>'}
              </tbody>
            </table>

            <div class="footer">
              <p>Generated with SplitMate &bull; Share Expenses, Stay Friends</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Export Expense History`,
        UTI: "com.adobe.pdf",
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("PDF generation failed in HistoryScreen:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (loading && !refreshing) {
    return <LoadingSpinner message="Fetching history..." />;
  }

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="receipt-outline" size={24} color={COLORS.primary} style={styles.headerTitleIcon} />
          <Text style={styles.mainTitle}>Expenses History</Text>
        </View>
        <Text style={styles.subtitle}>Track your overall splits across all groups</Text>

        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            placeholder="Search by description or group..."
            placeholderTextColor={COLORS.gray}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Filters Row */}
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingRight: 20 }}
            style={{ flex: 1 }}
          >
            {/* Month Dropdown Trigger */}
            {availableMonths.length > 1 && (
              <TouchableOpacity
                style={[
                  styles.dropdownTrigger,
                  selectedMonth !== "All" && styles.dropdownTriggerActive
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMonthDropdownOpen(!monthDropdownOpen);
                  setDropdownOpen(false);
                  setCurrencyDropdownOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color={selectedMonth !== "All" ? COLORS.white : COLORS.gray}
                />
                <Text
                  style={[
                    styles.dropdownTriggerText,
                    selectedMonth !== "All" && styles.dropdownTriggerTextActive
                  ]}
                  numberOfLines={1}
                >
                  {selectedMonth === "All" ? "Month" : selectedMonth}
                </Text>
                <Ionicons
                  name={monthDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={13}
                  color={selectedMonth !== "All" ? COLORS.white : COLORS.gray}
                />
              </TouchableOpacity>
            )}

            {/* Category Dropdown Trigger */}
            {availableCategories.length > 1 && (
              <TouchableOpacity
                style={[
                  styles.dropdownTrigger,
                  selectedCategory !== "All" && styles.dropdownTriggerActive
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDropdownOpen(!dropdownOpen);
                  setMonthDropdownOpen(false);
                  setCurrencyDropdownOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="funnel-outline"
                  size={13}
                  color={selectedCategory !== "All" ? COLORS.white : COLORS.gray}
                />
                <Text
                  style={[
                    styles.dropdownTriggerText,
                    selectedCategory !== "All" && styles.dropdownTriggerTextActive
                  ]}
                  numberOfLines={1}
                >
                  {selectedCategory === "All" ? "Category" : selectedCategory}
                </Text>
                <Ionicons
                  name={dropdownOpen ? "chevron-up" : "chevron-down"}
                  size={13}
                  color={selectedCategory !== "All" ? COLORS.white : COLORS.gray}
                />
              </TouchableOpacity>
            )}

            {/* Currency Dropdown Trigger */}
            {availableCurrencies.length > 1 && (
              <TouchableOpacity
                style={[
                  styles.dropdownTrigger,
                  selectedCurrency !== "All" && styles.dropdownTriggerActive
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrencyDropdownOpen(!currencyDropdownOpen);
                  setDropdownOpen(false);
                  setMonthDropdownOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="cash-outline"
                  size={13}
                  color={selectedCurrency !== "All" ? COLORS.white : COLORS.gray}
                />
                <Text
                  style={[
                    styles.dropdownTriggerText,
                    selectedCurrency !== "All" && styles.dropdownTriggerTextActive
                  ]}
                  numberOfLines={1}
                >
                  {selectedCurrency === "All" ? "Currency" : selectedCurrency}
                </Text>
                <Ionicons
                  name={currencyDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={13}
                  color={selectedCurrency !== "All" ? COLORS.white : COLORS.gray}
                />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Stats Hero Card */}
        {!searchQuery && (
          <AnimatedView entering={FadeInDown.duration(400).delay(100)} style={styles.heroCard}>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1, marginRight: 10 }}>
                  <Ionicons name="wallet-outline" size={24} color={COLORS.white} />
                  <Text style={styles.heroTitle} numberOfLines={1}>{stats.label}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.heroPdfButton} 
                  onPress={exportToPDF}
                  activeOpacity={0.7}
                >
                  <Ionicons name="download-outline" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              {Object.keys(stats.currencyTotals).length === 0 ? (
                <View style={styles.heroRow}>
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatValue}>-</Text>
                    <Text style={styles.heroStatLabel}>Your Net Share</Text>
                  </View>
                  <View style={styles.heroDivider} />
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatValue}>-</Text>
                    <Text style={styles.heroStatLabel}>Total Paid By You</Text>
                  </View>
                </View>
              ) : (
                Object.keys(stats.currencyTotals).map((currencyCode, index) => {
                  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
                  const item = stats.currencyTotals[currencyCode];
                  return (
                    <View key={currencyCode}>
                      {index > 0 && <View style={styles.currencySectionDivider} />}
                      <View style={styles.heroCurrencyHeader}>
                        <Text style={styles.heroCurrencyTitle}>{currencyCode} Overview</Text>
                      </View>
                      <View style={styles.heroRow}>
                        <View style={styles.heroStatItem}>
                          <Text style={styles.heroStatValue}>{symbol}{item.yourShare.toFixed(2)}</Text>
                          <Text style={styles.heroStatLabel}>Your Net Share</Text>
                        </View>
                        <View style={styles.heroDivider} />
                        <View style={styles.heroStatItem}>
                          <Text style={styles.heroStatValue}>{symbol}{item.youPaid.toFixed(2)}</Text>
                          <Text style={styles.heroStatLabel}>Total Paid By You</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}

              <View style={styles.heroFooter}>
                <Text style={styles.heroFooterText}>
                  {selectedMonth === "All" ? "Aggregated for all transactions" : `Aggregated for ${selectedMonth}`}
                </Text>
              </View>
            </LinearGradient>
          </AnimatedView>
        )}

        {/* Expenses List */}
        {expenses.length === 0 ? (
          <AnimatedView entering={FadeInDown.duration(400).delay(200)} style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="receipt-outline" size={44} color={COLORS.gray} />
            </View>
            <Text style={styles.emptyTitle}>No Expenses Recorded</Text>
            <Text style={styles.emptySubtext}>
              Once you add expenses inside any group, your monthly chronological transactions will appear here!
            </Text>
          </AnimatedView>
        ) : filteredExpenses.length === 0 ? (
          <AnimatedView entering={FadeInDown.duration(400)} style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="search" size={44} color={COLORS.gray} />
            </View>
            <Text style={styles.emptyTitle}>No Match Found</Text>
            <Text style={styles.emptySubtext}>
              We couldn't find any transactions matching "{searchQuery}". Try searching for a different keyword.
            </Text>
          </AnimatedView>
        ) : (
          Object.keys(monthGroups).map((monthName, mIndex) => (
            <AnimatedView
              key={monthName}
              entering={FadeInDown.duration(400).delay(mIndex * 100)}
              style={styles.monthSection}
            >
              {/* Month Header */}
              <View style={styles.monthHeaderRow}>
                <Text style={styles.monthTitle}>{monthName}</Text>
                <View style={styles.monthBadge}>
                  <Text style={styles.monthBadgeText}>
                    {monthGroups[monthName].length} item{monthGroups[monthName].length !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              {/* Month Items */}
              {monthGroups[monthName].map((expense, eIndex) => {
                const category = expense.category;
                const accentColor = category?.color || getCategoryColor(expense.description);
                const categoryIconName = category?.icon || "receipt-outline";
                const categoryNameLabel = category?.name || "Others";

                const isPaidByMe = expense.paidBy?._id === currentUserId;
                const perPerson = expense.amount / (expense.splitBetween?.length || 1);
                const isSplitWithMe = expense.splitBetween?.some((m) => m._id === currentUserId);
                const currencySymbol = CURRENCY_SYMBOLS[expense.groupId?.currency] || "₹";

                return (
                  <AnimatedView
                    key={expense._id}
                    entering={ZoomIn.duration(300).delay(eIndex * 50)}
                    layout={Layout.springify()}
                  >
                    <TouchableOpacity
                      style={styles.expenseCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate("Groups", {
                          screen: "ExpenseDetail",
                          params: {
                            expense,
                            groupId: expense.groupId?._id || expense.groupId,
                            fromHistory: true,
                          },
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      {/* Left accent bar */}
                      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

                      <View style={styles.cardInner}>
                        {/* Top Metadata Row */}
                        <View style={styles.cardHeaderRow}>
                          <View style={[styles.iconCircle, { backgroundColor: accentColor + "12" }]}>
                            <Ionicons name={categoryIconName} size={18} color={accentColor} />
                          </View>
                          
                          <View style={styles.cardDescBlock}>
                            <Text style={styles.cardDescription} numberOfLines={1}>
                              {expense.description}
                            </Text>
                            
                            {/* Group name indicator badge + Category badge */}
                            <View style={styles.groupBadgeContainer}>
                              <View style={[styles.groupBadge, { backgroundColor: COLORS.primary + "10" }]}>
                                <Ionicons name="people-outline" size={10} color={COLORS.primary} />
                                <Text style={styles.groupBadgeText} numberOfLines={1}>
                                  {expense.groupId?.name || "Unknown Group"}
                                </Text>
                              </View>
                              {categoryNameLabel && (
                                <View style={[styles.categoryHistoryChip, { backgroundColor: accentColor + "10" }]}>
                                  <Text style={[styles.categoryHistoryChipText, { color: accentColor }]} numberOfLines={1}>
                                    {categoryNameLabel}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>

                          <View style={styles.amountBlock}>
                            <Text style={styles.totalAmount}>{currencySymbol}{Number(expense.amount).toFixed(2)}</Text>
                            {isSplitWithMe ? (
                              <Text style={styles.shareAmount}>
                                Your Share: {currencySymbol}{perPerson.toFixed(2)}
                              </Text>
                            ) : (
                              <Text style={styles.shareAmountZero}>Not in Split</Text>
                            )}
                          </View>
                        </View>

                        {/* Divider */}
                        <View style={styles.cardDivider} />

                        {/* Bottom Information Row */}
                        <View style={styles.cardBottomRow}>
                          <View style={styles.payerMetaChip}>
                            {expense.paidBy?.avatar ? (
                              <Image source={{ uri: expense.paidBy.avatar }} style={styles.payerAvatar} />
                            ) : (
                              <View style={[styles.payerAvatarFallback, { backgroundColor: COLORS.primary + "18" }]}>
                                <Text style={styles.payerAvatarText}>
                                  {getInitials(expense.paidBy?.name)}
                                </Text>
                              </View>
                            )}
                            <Text style={styles.payerLabel} numberOfLines={1}>
                              {isPaidByMe ? "Paid by You" : `Paid by ${expense.paidBy?.name?.split(" ")[0] || "Someone"}`}
                            </Text>
                          </View>

                          <Text style={styles.dateLabel}>
                            {formatExpenseDate(expense.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </AnimatedView>
                );
              })}
            </AnimatedView>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Dropdown Options Backdrop and Popover - root level positioned */}
      {monthDropdownOpen && availableMonths.length > 1 && (
        <>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setMonthDropdownOpen(false)}
          />
          <AnimatedView
            entering={FadeInDown.duration(200)}
            style={[styles.dropdownMenuRoot, { left: 20 }]}
          >
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {availableMonths.map((m) => {
                const isActive = selectedMonth === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.dropdownItem,
                      isActive && styles.dropdownItemActive
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedMonth(m);
                      setMonthDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isActive && styles.dropdownItemTextActive
                      ]}
                    >
                      {m}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </AnimatedView>
        </>
      )}

      {dropdownOpen && availableCategories.length > 1 && (
        <>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setDropdownOpen(false)}
          />
          <AnimatedView
            entering={FadeInDown.duration(200)}
            style={[styles.dropdownMenuRoot, { right: 110 }]}
          >
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {availableCategories.map((c) => {
                const isActive = selectedCategory === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.dropdownItem,
                      isActive && styles.dropdownItemActive
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(c);
                      setDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isActive && styles.dropdownItemTextActive
                      ]}
                    >
                      {c}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </AnimatedView>
        </>
      )}

      {currencyDropdownOpen && availableCurrencies.length > 1 && (
        <>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setCurrencyDropdownOpen(false)}
          />
          <AnimatedView
            entering={FadeInDown.duration(200)}
            style={[styles.dropdownMenuRoot, { right: 20 }]}
          >
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {availableCurrencies.map((c) => {
                const isActive = selectedCurrency === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.dropdownItem,
                      isActive && styles.dropdownItemActive
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCurrency(c);
                      setCurrencyDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isActive && styles.dropdownItemTextActive
                      ]}
                    >
                      {c === "All" ? "All" : `${c} (${CURRENCY_SYMBOLS[c] || c})`}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </AnimatedView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: "600",
  },
  topHeader: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
    overflow: "visible",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitleIcon: {
    marginTop: 1,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 4,
    fontWeight: "500",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F5FA",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
  },

  filtersWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    zIndex: 20,
    overflow: "visible",
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F4F5FA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxWidth: 150,
  },
  dropdownTriggerActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dropdownTriggerText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray,
  },
  dropdownTriggerTextActive: {
    color: COLORS.white,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 9999,
  },
  dropdownMenuRoot: {
    position: "absolute",
    top: 212,
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    width: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 15,
    zIndex: 10000,
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primary + "0A",
  },
  dropdownItemText: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: "500",
  },
  dropdownItemTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
    paddingVertical: 0,
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    ...SHADOWS.medium,
  },
  heroGradient: {
    padding: 20,
  },
  currencySectionDivider: {
    height: 1,
    backgroundColor: COLORS.white + "20",
    marginVertical: 12,
  },
  heroCurrencyHeader: {
    marginBottom: 8,
    alignSelf: "flex-start",
    backgroundColor: COLORS.white + "18",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  heroCurrencyTitle: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  heroPdfButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
  },
  heroStatValue: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  heroStatLabel: {
    color: COLORS.white + "B0",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  heroDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.white + "30",
  },
  heroFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.white + "20",
    paddingTop: 12,
    marginTop: 16,
    alignItems: "center",
  },
  heroFooterText: {
    color: COLORS.white + "90",
    fontSize: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 48,
    paddingHorizontal: 24,
    marginTop: 20,
    ...SHADOWS.soft,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 20,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.dark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  monthBadge: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  monthBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.gray,
  },
  expenseCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    ...SHADOWS.soft,
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardInner: {
    flex: 1,
    padding: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardDescBlock: {
    flex: 1,
    marginRight: 8,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 4,
  },
  groupBadgeContainer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  categoryHistoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 120,
  },
  categoryHistoryChipText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 140,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  amountBlock: {
    alignItems: "flex-end",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 2,
  },
  shareAmount: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
  },
  shareAmountZero: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: "500",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  payerMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  payerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F3F4F6",
  },
  payerAvatarFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  payerAvatarText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.primary,
  },
  payerLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    maxWidth: 120,
  },
  dateLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: "500",
  },
});
