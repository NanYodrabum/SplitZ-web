import React, { useState, useEffect } from 'react';
import { User, Mail, Edit, Save, Camera } from 'lucide-react';
import useUserStore from '../stores/userStore';
import { useNavigate } from 'react-router';

function Account() {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
  });


  useEffect(() => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
    });
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = () => {
    updateUser(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
    });
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    navigate('/');
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Account Settings</h1>
        <p className="text-gray-600">View and manage your account information</p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-300 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Delete Profile</h3>
            <p className="mb-6">Are you sure you want to delete your profile? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Card */}
      <div className="bg-white rounded-xl border p-6 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
          {/* Profile Image */}
          <div className="relative">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              <img
                src={`https://ui-avatars.com/api/?name=${user.name}&background=random&color=fff`}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
              <User size={40} className="text-gray-400" />

            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 bg-purple-600 text-white p-1 rounded-full">
                <Camera size={16} />
              </button>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">{user.name}</h2> {/* Use user.name from the store */}
            <div className="flex items-center gap-1 text-gray-600 mb-1">
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Edit size={18} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Save size={18} />
                <span>Save</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 p-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                <span>Cancel</span>
              </button>
            </div>
          )}
          <button
            onClick={handleDeleteClick}
            className="flex items-center gap-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Edit size={18} />
            <span>Delete Profile</span>
          </button>
        </div>

        {isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Account;