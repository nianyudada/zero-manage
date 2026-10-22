import { createBrowserRouter } from 'react-router';
import Layout from './pages/Layout';
import EnterpriseList from './pages/EnterpriseList';
import TemplateList from './pages/TemplateList';
import NotificationHistory from './pages/NotificationHistory';
import Settings from './pages/Settings';
import HolidayCalendar from './pages/HolidayCalendar';
import PolicyManagement from './pages/PolicyManagement';
import PopupAlertManagement from './pages/PopupAlertManagement';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: EnterpriseList },
      { path: 'enterprises', Component: EnterpriseList },
      { path: 'templates', Component: TemplateList },
      { path: 'notifications', Component: NotificationHistory },
      { path: 'settings', Component: Settings },
      { path: 'popups', Component: PopupAlertManagement },
      { path: 'policies', Component: PolicyManagement },
      { path: 'holidays', Component: HolidayCalendar },
    ],
  },
]);
