import React, { useEffect } from 'react';
import { createPageUrl } from '@/utils';

export default function Dashboard() {
  useEffect(() => {
    window.location.replace(createPageUrl('UserDashboard'));
  }, []);
  return null;
}