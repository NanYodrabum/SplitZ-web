import axios from "axios"
import {create} from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"


const useUserStore = create(persist((set,get)=>({
    user:null,
    token : "",
    login : async (input)=>{
        const rs = await axios.post('http://localhost:8800/auth/login', input)
        console.log(rs);
        set({token: rs.data.token, user: rs.data.payload})
        return rs.data
    },
    logout: () => set({token: "", user: null})

}), {
    name: "state",
    storage: createJSONStorage(()=>localStorage)
}))

export default useUserStore