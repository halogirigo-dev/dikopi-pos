"use client";
import { signOut } from "next-auth/react";
export default function MoreLogout(){
  return <button className="btn" style={{ width:"100%", color:"var(--red)" }} onClick={()=>signOut({callbackUrl:"/login"})}>Logout</button>;
}
