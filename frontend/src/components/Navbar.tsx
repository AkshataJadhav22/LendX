import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, ChevronRight, LayoutDashboard, LogOut, CreditCard, Users, Settings } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const borrowerLinks = [
    { to: '/dashboard', label: 'Score', icon: <LayoutDashboard size={16} /> },
    { to: '/apply', label: 'Apply', icon: <CreditCard size={16} /> },
    { to: '/vouch', label: 'Vouch', icon: <Users size={16} /> },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-neon-green/10">
      <div className="max-w-content mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neon-gradient rounded-lg flex items-center justify-center">
            <span className="text-forest-black font-black text-sm">L</span>
          </div>
          <span className="text-cream font-black text-xl tracking-tight">LendX</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {!user && (
            <>
              <a href="/#features" className="nav-link">Features</a>
              <a href="/#how-it-works" className="nav-link">How It Works</a>
              <a href="/#scoring" className="nav-link">Scoring</a>
            </>
          )}
          {user?.role === 'borrower' && borrowerLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link flex items-center gap-1.5 ${location.pathname === link.to ? 'text-neon-green' : ''}`}
            >
              {link.icon} {link.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin" className={`nav-link flex items-center gap-1.5 ${location.pathname === '/admin' ? 'text-neon-green' : ''}`}>
              <Settings size={16} /> Admin
            </Link>
          )}
        </div>

        {/* Right CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {!user ? (
            <>
              <Link to="/auth" className="btn-outline-light text-sm py-2 px-4">Log In</Link>
              <Link to="/auth" className="btn-primary text-sm py-2 px-4">
                Get Started <ChevronRight size={16} />
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-cream hover:text-neon-green transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-neon-green flex items-center justify-center text-forest-black font-bold text-sm">
                  {user.full_name[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user.full_name.split(' ')[0]}</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-12 w-48 card py-2 animate-fade-in">
                  <div className="px-4 py-2 border-b border-cream-soft">
                    <p className="text-xs text-muted-green">{user.email}</p>
                    <p className="text-xs font-semibold text-forest-black capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-cream" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-forest-black border-t border-forest-deep px-6 py-4 flex flex-col gap-4 animate-fade-in">
          {user?.role === 'borrower' && borrowerLinks.map(link => (
            <Link key={link.to} to={link.to} className="nav-link flex items-center gap-2" onClick={() => setMenuOpen(false)}>
              {link.icon} {link.label}
            </Link>
          ))}
          {!user && (
            <>
              <Link to="/auth" className="btn-outline-light justify-center" onClick={() => setMenuOpen(false)}>Log In</Link>
              <Link to="/auth" className="btn-primary justify-center" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
          {user && (
            <button onClick={handleLogout} className="text-red-400 text-left font-medium flex items-center gap-2">
              <LogOut size={16} /> Sign Out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
