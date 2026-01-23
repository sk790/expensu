import { storage } from "../utils/storage";
import api from "./api";

export const authService = {
  async login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    const { token, user } = response.data;
    await storage.setToken(token);
    await storage.setUser(user);
    return response.data;
  },

  async register(name, email, password) {
    console.log(name);

    const response = await api.post("/auth/register", {
      name,
      email,
      password,
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
    const response = await api.post("/groups", { name, members });
    return response.data;
  },

  async getUserGroups() {
    const response = await api.get("/groups");
    return response.data;
  },

  async getGroup(groupId) {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },
  async joinGroupByInvite(inviteCode) {
    const response = await api.post(`/groups/join/${inviteCode}`);
    return response.data;
  },

  async addExpense(groupId, amount, splitBetween, description) {
    const response = await api.post(`/groups/${groupId}/expenses`, {
      amount,
      splitBetween,
      description,
    });
    return response.data;
  },

  async editExpense(groupId, expenseId, amount, splitBetween, description) {
    const response = await api.put(`/groups/${groupId}/expenses/${expenseId}`, {
      amount,
      splitBetween,
      description,
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
    const response = await api.get(`/groups/${groupId}/expenses`);
    return response.data;
  },

  async getGroupBalances(groupId) {
    const response = await api.get(`/groups/${groupId}/balances`);
    return response.data;
  },
  async addMemberToGroup(groupId, userId) {
    const response = await api.post(`/groups/${groupId}/members`, { userId });
    return response.data;
  },

  async removeMember(groupId, memberId) {
    const response = await api.delete(`/groups/${groupId}/members`, {
      data: { memberId },
    });
    return response.data;
  },
};
export const userService = {
  async getUserList() {
    const response = await api.get(`/user`);

    return response.data;
  },

  async searchUserByEmail(email) {
    const response = await api.get(`/user/search`, { params: { email } });
    return response.data;
  },

  async getUserProfile() {
    const response = await api.get("/user/profile");
    return response.data;
  },
};
