import React from 'react'
import { Routes, Route } from 'react-router'
import Layout from '../components/layout/Layout'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/Register'
import BillsPage from '../pages/BillsPage'
import PaymentsPage from '../pages/PaymentsPage'
import LandingPage from "../pages/LandingPage"



function AppRoute() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage/>} />
      <Route path="/home" element={<HomePage/>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/bills" element={<BillsPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
    </Routes>
  );
}

export default AppRoute;