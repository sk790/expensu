import { storage } from "../utils/storage";
import api from "./api";

export const authService = {
  async login(email, password) {
    const response = await api.post("auth/login", { email, password });
    const { token, user } = response.data;
    await storage.setToken(token);
    await storage.setUser(user);
    return response.data;
  },

  async register(name, email, password, referralCode) {
    console.log(name);

    const response = await api.post("auth/register", {
      name,
      email,
      password,
      referralCode,
    });
    const { token, user } = response.data;
    console.log(response, "res");

    await storage.setToken(token);
    await storage.setUser(user);
    return response.data;
  },

  async logout() {
    await storage.removeToken();
    await storage.removeUser();
  },
};

export const groupService = {
  async createGroup(name, members) {
    const response = await api.post("groups", { name, members });
    return response.data;
  },

  async getUserGroups() {
    const response = await api.get("groups");
    return response.data;
  },

  async getUserExpenses() {
    const response = await api.get("groups/user/expenses");
    return response.data;
  },

  async getGroup(groupId) {
    const response = await api.get(`groups/${groupId}`);
    return response.data;
  },
  async joinGroupByInvite(inviteCode) {
    const response = await api.post(`groups/join/${inviteCode}`);
    return response.data;
  },

  async addExpense(groupId, amount, splitBetween, description, paidBy) {
    const response = await api.post(`groups/${groupId}/expenses`, {
      amount,
      splitBetween,
      description,
      paidBy,
    });
    console.log(response);
    
    return response.data;
  },

  async editExpense(groupId, expenseId, amount, splitBetween, description, paidBy) {
    const response = await api.put(`groups/${groupId}/expenses/${expenseId}`, {
      amount,
      splitBetween,
      description,
      paidBy,
    });
    return response.data;
  },

  async deleteExpense(groupId, expenseId) {
    const response = await api.delete(
      `/groups/${groupId}/expenses/${expenseId}`,
    );
    return response.data;
  },

  async getGroupExpenses(groupId) {
    const response = await api.get(`groups/${groupId}/expenses`);
    return response.data;
  },

  async getGroupBalances(groupId) {
    const response = await api.get(`groups/${groupId}/balances`);
    return response.data;
  },
  async addMemberToGroup(groupId, userId) {
    const response = await api.post(`groups/${groupId}/members`, { userId });
    return response.data;
  },

  async removeMember(groupId, memberId) {
    const response = await api.delete(`groups/${groupId}/members`, {
      data: { memberId },
    });
    return response.data;
  },
  async settleUp(groupId, fromUserId, toUserId, amount) {
    const response = await api.post(`groups/${groupId}/settle`, {
      fromUserId,
      toUserId,
      amount,
    });
    return response.data;
  },

  async getGroupSettlements(groupId) {
    const response = await api.get(`groups/${groupId}/payments`);
    return response.data;
  },

  async deleteGroup(groupId) {
    const response = await api.delete(`groups/${groupId}`);
    return response.data;
  },

  async updateGroup(groupId, name) {
    const response = await api.put(`groups/${groupId}`, { name });
    return response.data;
  },
};
export const userService = {
  async getUserList() {
    const response = await api.get(`user`);

    return response.data;
  },

  async searchUserByEmail(email, groupId) {
    const response = await api.get(`user/search`, {
      params: { email, groupId },
    });
    return response.data;
  },

  async getUserProfile() {
    const response = await api.get("user/profile");
    return response.data;
  },

  async updateProfile(userData) {
    const response = await api.put("user/profile", userData);
    if (response.data.success || response.data.user) {
      await storage.setUser(response.data.user);
    }
    return response.data;
  },

  async savePushToken(token) {
    const response = await api.post("user/push-token", { token });
    return response.data;
  },
};

export const walletService = {
  async getWalletStats() {
    const response = await api.get("wallet/stats");
    return response.data;
  },
};

export const groupInvitationService = {
  async sendInvitation(groupId, userId) {
    const response = await api.post("group-invitations/send", { groupId, userId });
    return response.data;
  },

  async getMyInvitations() {
    const response = await api.get("group-invitations/my-invitations");
    return response.data;
  },

  async respondToInvitation(invitationId, status) {
    const response = await api.post("group-invitations/respond", { invitationId, status });
    return response.data;
  },
};

export const aiService = {
  async chat(message, history = []) {
    const response = await api.post("ai/chat", { message, history });
    return response.data;
  },
};

