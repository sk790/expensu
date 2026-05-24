import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { groupService, groupInvitationService } from '../../services/authService';

export const fetchUserGroups = createAsyncThunk(
  'groups/fetchUserGroups',
  async (_, { rejectWithValue }) => {
    try {
      const groupsRes = await groupService.getUserGroups();
      
      let invitationsCount = 0;
      try {
        const invRes = await groupInvitationService.getMyInvitations();
        invitationsCount = invRes.data?.length || 0;
      } catch (invError) {
        console.error("Failed to fetch invitations:", invError);
      }
      
      return {
        groups: groupsRes.data,
        invitationsCount
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch groups');
    }
  },
  {
    condition: (forceRefresh, { getState }) => {
      const { groups } = getState();
      if (!forceRefresh && groups.hasFetched) {
        return false; // Skip fetching if already fetched and not forced
      }
      return true;
    }
  }
);

export const deleteUserGroup = createAsyncThunk(
  'groups/deleteUserGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      await groupService.deleteGroup(groupId);
      return groupId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete group');
    }
  }
);

const groupSlice = createSlice({
  name: 'groups',
  initialState: {
    list: [],
    invitationsCount: 0,
    loading: true,
    hasFetched: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchUserGroups
      .addCase(fetchUserGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.hasFetched = true;
        state.list = action.payload.groups;
        state.invitationsCount = action.payload.invitationsCount;
      })
      .addCase(fetchUserGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // deleteUserGroup
      .addCase(deleteUserGroup.fulfilled, (state, action) => {
        state.list = state.list.filter(g => g._id !== action.payload);
      });
  },
});

export default groupSlice.reducer;
