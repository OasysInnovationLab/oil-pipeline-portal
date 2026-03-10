import { Link, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Menu, Moon, Sun, LogOut, User, X, BarChart3, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import logo from '@/assets/images/logo.svg';

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Overview', href: '/', icon: BarChart3 },
    { name: 'Pipelines', href: '/pipelines', icon: Gauge },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div 
        className="mx-auto px-6 py-4 backdrop-blur-md"
        style={{ 
          background: 'rgba(0, 4, 40, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src={logo} 
              alt="Oasys Innovation Lab" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Center Navigation - Desktop */}
          <nav className="hidden md:flex items-center">
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right Side - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full hover:bg-white/10"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-white/60" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-white/60" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-white/60" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white/90 leading-none">
                    {user?.name || user?.username}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {isAdmin ? 'Admin' : 'User'}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout}
                className="rounded-full hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 text-white/60" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-white/80" />
            ) : (
              <Menu className="h-6 w-6 text-white/80" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/10">
            <nav className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-white/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">
                    {user?.name || user?.username}
                  </p>
                  <p className="text-xs text-white/40">
                    {isAdmin ? 'Admin' : 'User'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="rounded-full hover:bg-white/10"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-white/60" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-white/60" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={logout}
                  className="rounded-full hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4 text-white/60" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
