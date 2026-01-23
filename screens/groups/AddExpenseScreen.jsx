import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { groupService } from '../../services/authService';
import { COLORS } from '../../utils/constants';

export default function AddExpenseScreen({ route, navigation }) {
  const { groupId, members } = route.params;
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(
    members.reduce((acc, member) => ({ ...acc, [member._id]: true }), {})
  );
  const [loading, setLoading] = useState(false);

  const handleAddExpense = async () => {
    if (!amount || !description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const splitBetween = Object.keys(selectedMembers).filter(id => selectedMembers[id]);
    if (splitBetween.length === 0) {
      Alert.alert('Error', 'Please select at least one member to split with');
      return;
    }

    setLoading(true);
    try {
      await groupService.addExpense(
        groupId,
        parseFloat(amount),
        splitBetween,
        description.trim()
      );
      Alert.alert('Success', 'Expense added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (memberId) => {
    setSelectedMembers(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const selectedCount = Object.values(selectedMembers).filter(Boolean).length;
  const perPersonAmount = amount && selectedCount > 0 
    ? (parseFloat(amount) / selectedCount).toFixed(2) 
    : '0.00';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          editable={!loading}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="What's this expense for?"
          value={description}
          onChangeText={setDescription}
          editable={!loading}
        />

        <Text style={styles.label}>Split Between</Text>
        <View style={styles.membersContainer}>
          {members.map((member) => (
            <View key={member._id} style={styles.memberRow}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Switch
                value={selectedMembers[member._id]}
                onValueChange={() => toggleMember(member._id)}
                disabled={loading}
                trackColor={{ false: COLORS.gray, true: COLORS.primary }}
              />
            </View>
          ))}
        </View>

        {amount && selectedCount > 0 && (
          <View style={styles.splitInfo}>
            <Text style={styles.splitText}>
              Each person pays: ₹{perPersonAmount}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAddExpense}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Adding...' : 'Add Expense'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 20,
  },
  form: {
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 10,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.light,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: COLORS.light,
  },
  membersContainer: {
    backgroundColor: COLORS.light,
    borderRadius: 8,
    padding: 10,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  memberName: {
    fontSize: 16,
    color: COLORS.dark,
  },
  splitInfo: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  splitText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});