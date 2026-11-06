import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({children, adminOnly=false}:any)=>{

  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();

  if(!token) return <Navigate to="/" replace />;

  if(adminOnly && role !== "admin")
    return <Navigate to="/dashboard" replace />;

  return children;
};

export default ProtectedRoute;