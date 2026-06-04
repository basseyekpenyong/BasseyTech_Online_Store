import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 mt-auto">
      <div className="container py-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
        <div>
          <p className="font-bold text-base mb-2"><span aria-hidden="true">💻 </span>Chiba-Tech</p>
          <p className="text-muted-foreground mb-3">Your one-stop tech store for gadgets, repairs, and digital services worldwide.</p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
              <span>41 Uncle Joe Avenue, Kubwa, Abuja, Nigeria</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
              <a href="tel:+2348063607290" className="hover:text-foreground">+234 806 360 7290</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
              <a href="tel:+2347012346604" className="hover:text-foreground">+234 701 234 6604</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
              <a href="mailto:globalchibatech@gmail.com" className="hover:text-foreground">globalchibatech@gmail.com</a>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-2">Shop</p>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link to="/products" className="hover:text-foreground">All Products</Link></li>
            <li><Link to="/products?category=laptops" className="hover:text-foreground">Laptops</Link></li>
            <li><Link to="/products?category=phones" className="hover:text-foreground">Phones</Link></li>
            <li><Link to="/products?category=accessories" className="hover:text-foreground">Accessories</Link></li>
            <li><Link to="/products?category=telecom-gadgets" className="hover:text-foreground">Telecom Gadgets</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-2">Services</p>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link to="/services" className="hover:text-foreground">View All Services</Link></li>
            <li><Link to="/appointments/new" className="hover:text-foreground">Book Appointment</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-2">Account</p>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link to="/register" className="hover:text-foreground">Create Account</Link></li>
            <li><Link to="/login" className="hover:text-foreground">Sign In</Link></li>
            <li><Link to="/orders" className="hover:text-foreground">My Orders</Link></li>
            <li><Link to="/appointments" className="hover:text-foreground">My Appointments</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Chiba-Tech. All rights reserved.
      </div>
    </footer>
  );
}
