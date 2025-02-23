import React from 'react'
import { Routes } from 'react-router'
import Layout from '../components/layout/Layout'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/Register'
import BillsPage from '../pages/BillsPage'
import PaymentsPage from '../pages/PaymentsPage'


function AppRoute() {
  return (
    <Routes>
    <Routes path="/" element={<Layout />}>
      <Routes index element={<HomePage />} />
      <Routes path="/login" element={<LoginPage />} />
      <Routes path="/register" element={<RegisterPage />} />
      <Routes path="/bills" element={<BillsPage />} />
      <Routes path="/payments" element={<PaymentsPage />} />
    </Routes>
  </Routes>
  )
}

export default AppRoute