import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdminRooms from './pages/AdminRooms';
import AdminBookings from './pages/AdminBookings';
import AdminGuests from './pages/AdminGuests';
import AdminContent from './pages/AdminContent';
import AdminSettings from './pages/AdminSettings';


export const PAGES = {
    "Home": Home,
    "Dashboard": Dashboard,
    "AdminRooms": AdminRooms,
    "AdminBookings": AdminBookings,
    "AdminGuests": AdminGuests,
    "AdminContent": AdminContent,
    "AdminSettings": AdminSettings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};