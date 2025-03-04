// import axios from 'axios';
// import { create } from 'zustand';
// import { createJSONStorage, persist } from 'zustand/middleware';

// const useUserStore = create(
//   persist(
//     (set, get) => ({
//       user: null,
//       token: '',
//       login: async (input) => {
//         const rs = await axios.post('http://localhost:8800/auth/login', input);
//         set({ token: rs.data.token, user: rs.data.payload });
//         return rs.data;
//       },
//       logout: () => set({ token: '', user: null }),
//       updateUser: async (input) => {
//         try {
//           const token = get().token;
//           const rs = await axios.patch(
//             'http://localhost:8800/user/update-profile',
//             input,
//             {
//               headers: {
//                 Authorization: `Bearer $ {token}`,
//               },
//             }
//           );
//           set({ user: rs.data.user });
//           return rs.data;
//         } catch (error) {
//           console.error('Error updating user:', error);
          
//         }
//       },
//       deleteUser: async (userId) => {
//         try {
//           const token = get().token;
//           await axios.delete(`http://localhost:8800/user/$ {userId}`, {
//             headers: {
//               Authorization: `Bearer $ {token}`,
//             },
//           });
//         } catch (error) {
//           console.error('Error deleting user:', error);
//         }
//       },
//     }),
//     {
//       name: 'state',
//       storage: createJSONStorage(() => localStorage),
//     }
//   )
// );

// export default useUserStore;


import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      token: '',
      login: async (input) => {
        try {
          const rs = await axios.post('http://localhost:8800/auth/login', input);
          // Only set state once with all updates in a single call
          set({ 
            token: rs.data.token, 
            user: rs.data.payload 
          });
          return rs.data;
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },
      logout: () => {
        // Set both values in one update
        set({ 
          token: '', 
          user: null 
        });
      },
      updateUser: async (input) => {
        try {
          const state = useUserStore.getState(); // Get current state without causing re-renders
          const token = state.token;
          
          const rs = await axios.patch(
            'http://localhost:8800/user/update-profile',
            input,
            {
              headers: {
                Authorization: `Bearer $ {token}`,
              },
            }
          );
          
          // Update only the user part of the state
          set({ user: rs.data.user });
          return rs.data;
        } catch (error) {
          console.error('Error updating user:', error);
          throw error;
        }
      },
      deleteUser: async (userId) => {
        try {
          const state = useUserStore.getState(); // Get current state without causing re-renders
          const token = state.token;
          
          await axios.delete(`http://localhost:8800/user/$ {userId}`, {
            headers: {
              Authorization: `Bearer $ {token}`,
            },
          });
          // Don't need to update state here as logout will be called after successful deletion
        } catch (error) {
          console.error('Error deleting user:', error);
          throw error;
        }
      },
    }),
    {
      name: 'user-storage', // Changed name to avoid conflicts with other storage
      storage: {
        getItem: (name) => {
          try {
            const value = localStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error('Error retrieving from localStorage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Error setting localStorage:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('Error removing from localStorage:', error);
          }
        },
      },
    }
  )
);

export default useUserStore;