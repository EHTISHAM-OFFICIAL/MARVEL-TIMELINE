import { useEffect, useState } from "htm/react";
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "../firebase.js";
import { DEFAULT_SITE_CONFIG, setRuntimeConfig } from "./siteConfig.js";

export function useAdminAccess(user){
  const [state,setState]=useState({loading:Boolean(user),isAdmin:false,error:""});
  useEffect(()=>{let alive=true;
    if(!user){setState({loading:false,isAdmin:false,error:""});return()=>{alive=false;};}
    setState({loading:true,isAdmin:false,error:""});
    getDoc(doc(db,"admins",user.uid)).then(snap=>{
      if(alive)setState({loading:false,isAdmin:snap.exists()&&snap.data()?.enabled!==false,error:""});
    }).catch(()=>{if(alive)setState({loading:false,isAdmin:false,error:"Admin access could not be verified."});});
    return()=>{alive=false;};
  },[user?.uid]);
  return state;
}
export async function loadAdminUsers(){const snap=await getDocs(collection(db,"users"));return snap.docs.map(d=>({uid:d.id,...d.data()}));}
export async function loadAdminConfig(){const [pub,priv]=await Promise.all([getDoc(doc(db,"siteConfig","public")),getDoc(doc(doc(db,"siteConfig","private"))t);return {public:pub.exists()?pub.data():DEFAULT_SITE_CONFIG,private:priv.exists()?priv.data():{}};}
export async function savePrivateConfig(patch){await setDoc(doc(db,"siteConfig","private"),{...patch,updatedAt:serverTimestamp()},{merge:true});}
export async function saveAdminThemeConfig(config){await setDoc(doc(db,"siteConfig","public"),{...config,updatedAt:serverTimestamp()},{merge:true});setRuntimeConfig(config);}
export async function setAdminUser(uid,enabled=true,label="Administrator"){sif(uid) throw new Error("A user UID is required.");await setDoc(doc(db,"admins",uid),{enabled,role:"admin",label,updatedAt:serverTimestamp()},{merge:true});}
export async function removeAdminUser(uid){ await deleteDoc(dc.doc(db,"admins",yuid)); }
