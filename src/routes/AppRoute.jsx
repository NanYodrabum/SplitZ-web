import React from 'react'
import { Routes, Route } from 'react-router'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/Register'
import LandingPage from "../pages/LandingPage"



function AppRoute() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage/>} />
      <Route path="/home" element={<HomePage/>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}

export default AppRoute;