import axios from 'axios';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: '',
      login: async (input) => {
        const rs = await axios.post('http://localhost:8800/auth/login', input);
        set({ token: rs.data.token, user: rs.data.payload });
        return rs.data;
      },
      logout: () => set({ token: '', user: null }),
      updateUser: async (input) => {
        try {
          const token = get().token;
          const rs = await axios.patch(
            'http://localhost:8800/user/update-profile',
            input,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          set({ user: rs.data.user });
          return rs.data;
        } catch (error) {
          console.error('Error updating user:', error);
          
        }
      },
      deleteUser: async (userId) => {
        try {
          const token = get().token;
          await axios.delete(`http://localhost:8800/user/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (error) {
          console.error('Error deleting user:', error);
        }
      },
    }),
    {
      name: 'state',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useUserStore;