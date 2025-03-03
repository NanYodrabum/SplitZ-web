import React from 'react'
import { useState } from "react";
import { Link, useNavigate } from 'react-router';
import useUserStore from '../stores/userStore';

function LoginPage() {
  const [error, setError] = useState("");
  const login = useUserStore(state => state.login)
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const [input, setInput] = useState({
    email: '',
    password: ''
  })


  const hdlClearInput = () => {
    setInput(input)
  }

  const hdlChange = e => {
    setInput(prv => ({ ...prv, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async(e) => {
    try {
      e.preventDefault();
      const {email, password} = input
      setError("");

      if (!input.email || !input.password) {
        setError("All fields are required");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
        setError("Invalid email format");
        return;
      }
      if (input.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      let data = await login(input)
      console.log(data);

      hdlClearInput();
      setShowSuccess(true); 
      
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);

      

    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError(errMsg);
      console.log(errMsg);
    }

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <Link to="/"
          className="absolute left-4 top-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span>Back</span>
        </Link>
        <h2 className="text-3xl font-bold text-center mb-6">Login to SplitZ</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Success Alert */}
        {showSuccess && (
          <div role="alert" className="alert alert-success mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Login Successful! Redirecting to HomePage...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
          <div>
            <label className="block text-gray-700 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={input.email}
              onChange={hdlChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={input.password}
              onChange={hdlChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
          >
            Login
          </button>
        </form>
        <p className="text-center text-gray-600 mt-4">
          Don't have an account? <a href="/register" className="text-blue-600 hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage






