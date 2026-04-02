import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute, AdminRoute, StudentRoute } from "@/routes/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminBooks from "@/pages/admin/Books";
import AdminMembers from "@/pages/admin/Members";
import IssueBook from "@/pages/admin/IssueBook";
import ReturnBook from "@/pages/admin/ReturnBook";
import Overdue from "@/pages/admin/Overdue";
import AdminSettings from "@/pages/admin/Settings";

// Student Pages
import StudentHome from "@/pages/student/Home";
import BrowseBooks from "@/pages/student/BrowseBooks";
import MyBooks from "@/pages/student/MyBooks";
import BorrowHistory from "@/pages/student/History";
import StudentProfile from "@/pages/student/Profile";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'text-sm',
            duration: 3000,
          }}
        />
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminRoute><AppLayout /></AdminRoute></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="books" element={<AdminBooks />} />
              <Route path="members" element={<AdminMembers />} />
              <Route path="issue" element={<IssueBook />} />
              <Route path="return" element={<ReturnBook />} />
              <Route path="overdue" element={<Overdue />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Student Routes */}
            <Route path="/student" element={<ProtectedRoute><StudentRoute><AppLayout /></StudentRoute></ProtectedRoute>}>
              <Route index element={<StudentHome />} />
              <Route path="books" element={<BrowseBooks />} />
              <Route path="mybooks" element={<MyBooks />} />
              <Route path="history" element={<BorrowHistory />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            {/* Landing page */}
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatbotWidget />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
