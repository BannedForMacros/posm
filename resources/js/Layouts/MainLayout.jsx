import React from 'react';
import Sidebar from '@/Components/sidebar';

const MainLayout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64 p-6">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;