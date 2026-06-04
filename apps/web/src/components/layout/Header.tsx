import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Products", to: "/products" },
  { label: "Services", to: "/services" },
  { label: "Contact", to: "/contact" },
];

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const cartCount = useCartStore((s) => s.itemCount());
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <img src="/logo.png" alt="Chiba-Tech" className="h-12 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium hover:text-primary transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-medium">{user.first_name} {user.last_name}</div>
                <div className="px-2 pb-1.5 text-xs text-muted-foreground">{user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/orders">My Orders</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/appointments">My Appointments</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem>
                {isAdmin() && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin"><LayoutDashboard className="mr-2 h-4 w-4" />Admin Dashboard</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-3 flex flex-col gap-1">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>
              {l.label}
            </Link>
          ))}
          {user && (
            <>
              <div className="border-t my-1" />
              <Link to="/orders" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>My Orders</Link>
              <Link to="/appointments" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>My Appointments</Link>
              <Link to="/profile" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Profile</Link>
              {isAdmin() && (
                <Link to="/admin" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Admin Dashboard</Link>
              )}
              <button className="text-sm font-medium py-2 text-destructive text-left" onClick={() => { handleLogout(); setMobileOpen(false); }}>
                Log out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
