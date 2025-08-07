import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  User, 
  ClipboardCheck, 
  Lightbulb, 
  TrendingUp, 
  Trophy 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { name: "Recommendations", href: "/recommendations", icon: Lightbulb },
  { name: "Progress Tracker", href: "/progress", icon: TrendingUp },
  { name: "Hackathons", href: "/hackathons", icon: Trophy },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-slate-200 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "text-primary bg-blue-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
