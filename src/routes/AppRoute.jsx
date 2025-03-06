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
import BillEdit from '../components/BillEdit';
import ProtectRoute from './ProtectRoute';
import RedirectAuthRoute from './RedirectAuthRoute';

function AppRoute() {
  return (
    <Routes>
      <Route path="/" element={<RedirectAuthRoute element={<LandingPage />} />} />
      <Route path="/login" element={<RedirectAuthRoute element={<LoginPage />} />} />
      <Route path="/register" element={<RedirectAuthRoute element={<RegisterPage />} />} />
      
      {/* Layout with nested routes for authenticated pages */}
      <Route path="/dashboard" element={<ProtectRoute el={<Layout />}/>}>
        <Route index element={<HomeContent />} />
        <Route path="bills" element={<Bill />} />
        <Route path="billlist" element={<BillList/>} />
        {/* Make sure more specific route comes first */}
        <Route path="bills/edit/:id" element={<BillEdit />} />
        <Route path="bills/:id" element={<BillDetail />} />
        <Route path="payments" element={<Payment />} />
        <Route path="account" element={<Account />} />
      </Route>
    </Routes>
  );
}

export default AppRoute;


