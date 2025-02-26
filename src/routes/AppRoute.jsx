import React from 'react';
import { Routes, Route } from 'react-router';
import Layout from '../components/Layout';
import HomeContent from '../components/Home';
import Bill from '../components/Bill';
import Payment from '../components/Payment';
import BillDetail from '../components/BillDetail';
import Account from '../components/Account';
import LandingPage from "../pages/LandingPage";
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/Register';
import BillList from '../components/Billlist';

function AppRoute() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Layout with nested routes for authenticated pages */}
      <Route path="/dashboard" element={<Layout />}>
        <Route index element={<HomeContent />} />
        <Route path="bills" element={<Bill />} />
        <Route path="billlist" element={<BillList/>} />
        <Route path="bill-detail/:billId" element={<BillDetail />} />
        <Route path="payments" element={<Payment />} />
        <Route path="account" element={<Account />} />
      </Route>
    </Routes>
  );
}

export default AppRoute;