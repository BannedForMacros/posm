import React from 'react';
import { Button } from '@/Components/ui/Button';

const SidebarButton = ({ icon, label, onClick, isCollapsed }) => {
  return (
    <Button
      variant="outline"
      size="md"
      className="w-full justify-start gap-3"
      onClick={onClick}
      title={isCollapsed ? label : undefined}
    >
      {icon}
      <span className={`${isCollapsed ? 'hidden' : 'block'} transition-all`}>
        {label}
      </span>
    </Button>
  );
};

export default SidebarButton;