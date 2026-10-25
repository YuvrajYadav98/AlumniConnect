import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import {
  MoreVertical,
  X,
  LogOut,
  Home,
  LayoutDashboard,
  Users,
  CalendarDays,
  Megaphone,
  BriefcaseBusiness,
  Network,
  UserRound,
  Award,
  ShieldCheck,
  BarChart3,
  ClipboardCheck,
  MessageCircle,
  UserPlus,
  GraduationCap,
  Bookmark,
  Handshake,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function MainLayout() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Debug - remove after authentication is fixed
  console.log("CURRENT USER:", user);
  console.log("CURRENT ROLE:", user?.role);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close menu after navigation
  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.95)] backdrop-blur-md">
        <nav className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">

          {/* LOGO */}
          <Link
            to="/"
            className="group flex items-center gap-3"
            onClick={closeMenu}
          >
            <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[11px] bg-[hsl(var(--accent))] text-[hsl(var(--primary))] transition-transform duration-300 group-hover:rotate-[-6deg]">
              <span className="absolute left-[8px] top-[9px] h-[13px] w-[13px] rounded-full border-[2px] border-[hsl(var(--primary))]" />

              <span className="absolute bottom-[7px] right-[7px] h-[11px] w-[11px] rounded-full border-[2px] border-[hsl(var(--primary))]" />

              <span className="absolute left-[12px] top-[19px] h-[2px] w-[18px] rotate-[-32deg] bg-[hsl(var(--primary))]" />
            </span>

            <span className="text-[15px] font-extrabold tracking-[-0.04em] text-[hsl(var(--primary))]">
              Alumni
              <span className="text-[hsl(var(--accent))]">
                Connect
              </span>
            </span>
          </Link>

          {/* ================= 3 DOT BUTTON ================= */}
          <div className="relative" ref={menuRef}>

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen((prev) => !prev)
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm transition-all hover:bg-slate-100 hover:shadow-md"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X size={20} />
              ) : (
                <MoreVertical size={20} />
              )}
            </button>

            {/* ================= MENU ================= */}
            {mobileMenuOpen && (
              <div className="absolute right-0 top-12 z-[100] w-[300px] max-h-[calc(100vh-100px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">

                {/* USER INFO */}
                {isAuthenticated && user && (
                  <div className="mb-2 rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Hi, {user.name?.split(" ")[0] || "User"}
                    </p>

                    <p className="mt-0.5 text-xs capitalize text-slate-500">
                      {user.role || "User"}
                    </p>
                  </div>
                )}

                {/* HOME */}
                <MenuLink
                  to="/"
                  icon={<Home size={17} />}
                  label="Home"
                  onClick={closeMenu}
                />

                {loading ? (
                  <div className="px-3 py-3 text-sm text-slate-400">
                    Loading...
                  </div>
                ) : isAuthenticated && user ? (
                  <>
                    {/* ================= COMMON ================= */}

                    <MenuLink
                      to="/dashboard"
                      icon={<LayoutDashboard size={17} />}
                      label="Dashboard"
                      onClick={closeMenu}
                    />

                    <MenuLink
                      to="/alumni"
                      icon={<Users size={17} />}
                      label="Alumni Directory"
                      onClick={closeMenu}
                    />

                    <MenuLink
                      to="/events"
                      icon={<CalendarDays size={17} />}
                      label="Events"
                      onClick={closeMenu}
                    />

                    <MenuLink
                      to="/announcements"
                      icon={<Megaphone size={17} />}
                      label="Announcements"
                      onClick={closeMenu}
                    />

                    {/* MY EVENTS */}
                    {user.role !== "admin" && (
                      <MenuLink
                        to="/my-events"
                        icon={<CalendarDays size={17} />}
                        label="My Events"
                        onClick={closeMenu}
                      />
                    )}

                    {/* JOBS */}
                    <MenuLink
                      to="/jobs"
                      icon={<BriefcaseBusiness size={17} />}
                      label="Jobs"
                      onClick={closeMenu}
                    />

                    {/* SAVED JOBS */}
                    {user.role !== "admin" && (
                      <MenuLink
                        to="/saved-jobs"
                        icon={<Bookmark size={17} />}
                        label="Saved Jobs"
                        onClick={closeMenu}
                      />
                    )}

                    {/* ALUMNI ONLY */}
                    {user.role === "alumni" && (
                      <>
                        <MenuLink
                          to="/my-jobs"
                          icon={<BriefcaseBusiness size={17} />}
                          label="My Jobs"
                          onClick={closeMenu}
                        />

                        <MenuLink
                          to="/profile"
                          icon={<UserRound size={17} />}
                          label="My Profile"
                          onClick={closeMenu}
                        />

                        <MenuLink
                          to="/achievements"
                          icon={<Award size={17} />}
                          label="Achievements"
                          onClick={closeMenu}
                        />
                      </>
                    )}

                    {/* NETWORK */}
                    <MenuLink
                      to="/connections"
                      icon={<Network size={17} />}
                      label="My Network"
                      onClick={closeMenu}
                    />

                    <MenuLink
                      to="/connections/requests"
                      icon={<UserPlus size={17} />}
                      label="Requests"
                      onClick={closeMenu}
                    />

                    {/* STUDENT ONLY */}
                    {user.role === "student" && (
                      <MenuLink
                        to="/mentors"
                        icon={<GraduationCap size={17} />}
                        label="Find Mentors"
                        onClick={closeMenu}
                      />
                    )}

                    {/* STUDENT + ALUMNI */}
                    {(user.role === "student" ||
                      user.role === "alumni") && (
                      <MenuLink
                        to="/mentorship-requests"
                        icon={<Handshake size={17} />}
                        label="Mentorship"
                        onClick={closeMenu}
                      />
                    )}

                    {/* ================= ADMIN ================= */}
                    {user.role === "admin" && (
                      <>
                        <div className="my-2 border-t border-slate-200" />

                        <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Admin
                        </p>

                        <MenuLink
                          to="/admin/dashboard"
                          icon={<ShieldCheck size={17} />}
                          label="Admin Dashboard"
                          admin
                          onClick={closeMenu}
                        />

                        <MenuLink
                          to="/admin/analytics"
                          icon={<BarChart3 size={17} />}
                          label="Analytics"
                          onClick={closeMenu}
                        />

                        <MenuLink
                          to="/admin/events"
                          icon={<CalendarDays size={17} />}
                          label="Manage Events"
                          onClick={closeMenu}
                        />

                        <MenuLink
                          to="/admin/jobs"
                          icon={<BriefcaseBusiness size={17} />}
                          label="Manage Jobs"
                          onClick={closeMenu}
                        />

                        <MenuLink
                          to="/admin/achievements"
                          icon={<Award size={17} />}
                          label="Achievement Approvals"
                          onClick={closeMenu}
                        />

                        <MenuLink
                          to="/admin/announcements"
                          icon={<Megaphone size={17} />}
                          label="Manage Announcements"
                          onClick={closeMenu}
                        />

                        <MenuLink
                          to="/admin/alumni"
                          icon={<Users size={17} />}
                          label="Alumni Verification"
                          onClick={closeMenu}
                        />

                        <MenuLink
                          to="/admin/users"
                          icon={<ClipboardCheck size={17} />}
                          label="Approvals"
                          onClick={closeMenu}
                        />
                      </>
                    )}

                    {/* MESSAGES */}
                    <MenuLink
                      to="/messages"
                      icon={<MessageCircle size={17} />}
                      label="Messages"
                      onClick={closeMenu}
                    />

                    {/* NOTIFICATIONS */}
                    <div className="my-2 border-t border-slate-200" />

                    <div className="flex items-center rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                      <span className="mr-3">
                        <NotificationBell />
                      </span>

                      <span>
                        Notifications
                      </span>
                    </div>

                    {/* LOGOUT */}
                    <div className="my-2 border-t border-slate-200" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    {/* PUBLIC */}
                    <MenuLink
                      to="/login"
                      icon={<UserRound size={17} />}
                      label="Login"
                      onClick={closeMenu}
                    />

                    <MenuLink
                      to="/register"
                      icon={<UserPlus size={17} />}
                      label="Register"
                      onClick={closeMenu}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <Outlet />
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <p className="text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} AlumniConnect. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

/* ================= MENU LINK ================= */

function MenuLink({
  to,
  icon,
  label,
  onClick,
  admin = false,
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        admin
          ? "text-blue-600 hover:bg-blue-50 hover:text-blue-800"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className="shrink-0">
        {icon}
      </span>

      <span>{label}</span>
    </Link>
  );
}
