import { useEffect, useState } from "htm/react";
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "../firebase.js";
import { DEFAULT_SITE_CONFIG, setRuntimeConfig } from "./siteConfig.js";

export function useAdminAccess(user){
 const [state,setState]=useState({loading:Boolean(user),isAdmin:false,error:""});
 useEffect(()=>{let alive=true;if(!user){setState({loading:false,isAdmin:false,error:""});return()=>{alive=false;};}setState({loading:true,isAdmin:false,error:""});
 getDoc(doc(db,"admins",user.uid)).then(s=>{
  if(!alive)return;
  if(s.exists()&&s.data()?.enabled===true){
    setState({loading:false,isAdmin:true,error:""});
  }else{
    setState({loading:false,isAdmin:false,error:"This account is not authorized to open the administrator panel."});
  }
}).catch(error=>{
  if(!alive)return;
  setState({
    loading:false,
    isAdmin:false,
    error:error?.code==="permission-denied"
      ? "We couldn’t verify administrator access. Please make sure the administrator record exists and the latest Firestore rules are deployed."
      : "We couldn’t verify administrator access right now. Please try again."
  });
});
 return()=>{alive=false;};
 },[user?.uid]);
 return state;
}
export async function loadAdminUsers(){
 const [usersSnap,adminsSnap]=await Promise.all([
  getDocs(collection(db,"users")),
  getDocs(collection(db,"admins")),
 ]);
 const adminIds=new Set(adminsSnap.docs.map((d)=>d.id));
 return usersSnap.docs
  .filter((d)=>!adminIds.has(d.id))
  .map(d=>({uid:d.id,...d.data()}));
}
export async function loadAdminConfig(){
 const pub=await getDoc(doc(db,"siteConfig","public"));
 const priv=await getDoc(doc(db,"siteConfig","private"));
 const publicConfig=pub.exists()?pub.data():DEFAULT_SITE_CONFIG;
 return {
  public:{
   ...DEFAULT_SITE_CONFIG,
   ...publicConfig,
   site:{...DEFAULT_SITE_CONFIG.site,...(publicConfig.site||{})},
   themes:{...DEFAULT_SITE_CONFIG.themes,...(publicConfig.themes||{})},
  },
  private:priv.exists()?priv.data():{}
 };
}
export async function savePrivateConfig(patch){await setDoc(doc(db,"siteConfig","private"),{...patch,updatedAt:serverTimestamp()},{merge:true});}
export async function saveAdminThemeConfig(config){await setDoc(doc(db,"siteConfig","public"),{...config,updatedAt:serverTimestamp()},{merge:true});setRuntimeConfig(config);}
export async function setAdminUser(uid,enabled=true,label="Administrator"){
 if(!uid)throw new Error("A user UID is required.");
 await setDoc(doc(db,"admins",uid),{enabled,role:"admin",label,updatedAt:serverTimestamp()},{merge:true});
 if(enabled) await deleteDoc(doc(db,"users",uid));
}
export async function removeAdminUser(uid){await deleteDoc(doc(db,"admins",uid));}