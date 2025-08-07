import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const { data: alerts } = useQuery({
    queryKey: ["/api/alerts"],
  });

  const unreadAlerts = alerts?.filter((alert: any) => !alert.read) || [];

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary" data-testid="logo">
                <i className="fas fa-code mr-2"></i>DevSkill
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 text-slate-600 hover:text-slate-900"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadAlerts.length > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  data-testid="badge-alert-count"
                >
                  {unreadAlerts.length}
                </Badge>
              )}
            </Button>
            <div className="flex items-center space-x-3">
              <img
                className="h-8 w-8 rounded-full"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150"
                alt="User avatar"
                data-testid="img-avatar"
              />
              <span className="text-sm font-medium text-slate-700" data-testid="text-username">
                Alex Johnson
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
