import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

export default function Predictions() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Demand Predictions</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered predictions for inventory demand and replenishment needs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prediction Interface</CardTitle>
          <CardDescription>
            Run ML predictions to forecast inventory demand
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            The prediction engine will be implemented in the next phase
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
