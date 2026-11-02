import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

import DashboardShell from '../../components/DashboardShell';
import CreatePost from '../../components/community/CreatePost';
import StudentNavbar from '../../components/StudentNavbar';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${
      localStorage.getItem('token') ||
      localStorage.getItem('userJwtToken') ||
      ''
    }`,
  },
});

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem('userData') || '{}');
  } catch {
    return {};
  }
};

const AllPosts = () => {
  const localUser = getLocalUser();

  const userRole = (
    localStorage.getItem('role') || localUser.role || 'student'
  ).toLowerCase();

  const currentUser = {
    _id: localUser._id || localUser.id || localStorage.getItem('userId'),
    id: localUser._id || localUser.id || localStorage.getItem('userId'),
    name: localStorage.getItem('name') || localUser.name || 'You',
    profilePhoto: localUser.profilePhoto || '',
  };

  const canAnnounce = userRole === 'admin';

  const handlePostCreated = () => {
    toast.success('Post published successfully!');
  };

  return (
    <>
    <StudentNavbar />
    <DashboardShell
      role={userRole}
      pageTitle="Update Post"
    >
      <Toaster position="top-right" />

      <div className="mx-auto max-w-4xl space-y-6">

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
            Alumni Nexus
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Update Post
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Share an update, achievement, project, or discussion
            with your college community.
          </p>
        </div>

        <CreatePost
          onPostCreated={handlePostCreated}
          currentUser={currentUser}
          canAnnounce={canAnnounce}
          apiBaseUrl={API_URL}
          getAuthConfig={getAuthConfig}
        />

      </div>
    </DashboardShell>
    </>
  );
};

export default AllPosts;