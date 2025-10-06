import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingDown, AlertTriangle, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  criticalItems: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    criticalItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: items, error } = await supabase
      .from("inventory_items")
      .select("*");

    if (!error && items) {
      const totalItems = items.length;
      const lowStockItems = items.filter(
        (item) => item.current_stock < item.min_required
      ).length;
      const criticalItems = items.filter(
        (item) => item.current_stock < item.min_required * 0.5
      ).length;
      const totalValue = items.reduce(
        (sum, item) => sum + item.current_stock * parseFloat(item.unit_cost.toString()),
        0
      );

      setStats({ totalItems, lowStockItems, totalValue, criticalItems });
    }
    setLoading(false);
  };

  const statCards = [
    {
      title: "Total Items",
      value: stats.totalItems,
      icon: Package,
      color: "from-primary to-primary-glow",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems,
      icon: TrendingDown,
      color: "from-warning to-warning/80",
    },
    {
      title: "Critical Items",
      value: stats.criticalItems,
      icon: AlertTriangle,
      color: "from-destructive to-destructive/80",
    },
    {
      title: "Total Stock Value",
      value: `$${stats.totalValue.toFixed(2)}`,
      icon: DollarSign,
      color: "from-success to-success/80",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your hospital inventory system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden hover-scale">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 bg-gradient-to-br ${stat.color} rounded-lg`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/inventory"
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <Package className="h-6 w-6 mb-2 text-primary" />
              <h3 className="font-semibold">View Inventory</h3>
              <p className="text-sm text-muted-foreground">
                Browse all inventory items
              </p>
            </a>
            <a
              href="/predictions"
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <TrendingDown className="h-6 w-6 mb-2 text-primary" />
              <h3 className="font-semibold">Run Predictions</h3>
              <p className="text-sm text-muted-foreground">
                Predict future demand
              </p>
            </a>
            <a
              href="/inventory"
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <AlertTriangle className="h-6 w-6 mb-2 text-warning" />
              <h3 className="font-semibold">Low Stock Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Check items needing restock
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
